require("dotenv").config();
const express = require("express");
const cors = require("cors");
const leadsRouter = require("./routes/leads");
const scrapeRouter = require("./routes/scrape");
const authRouter = require("./routes/auth");
const engagementRouter = require("./routes/engagementLogs");

const http = require("http");
const WebSocket = require("ws");
const sequelize = require("./database");
const path = require("path");
const { getScrapStatus, getScrapLogs } = require("./controllers/scrap_status.controller");
const { authenticateJWT } = require("./middlewares/authMiddleware");
const { adminUsersRouter } = require("./routes/adminUsers");
const sectionsRouter = require("./routes/sections");
const mauticRouter = require("./routes/mautic");
const timesheetRouter = require("./routes/timesheets");
const { Tasks } = require("./models/tasks.model");
const taskRouter = require("./routes/tasks");
const { Projects } = require("./models/projects.model");
const { Timesheets } = require("./models/timesheets.model");
const projectRouter = require("./routes/projects");
const { getUsageStats } = require("./controllers/usage_stats.controller");
const { exec } = require("child_process");
const { ServerCpuUsage } = require("./models/server_cpu_usage.model");
const workDaysRouter = require("./routes/workDays");

const app = express();

const server = http.createServer(app);

const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
  ws.on("message", async (message) => {
    console.log("Received message from client:", message);
        const response = await fetch('https://www.perplexity.ai/socket.io/?EIO=4&transport=polling', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(message),
        });

        const data = await response.json();
        socket.emit('message', data);
    // wss.clients.forEach((client) => {
    //   if (client.readyState === WebSocket.OPEN) {
    //     client.send(`Broadcast: ${message}`);
    //   }
    // });
  });
  ws.on("close", () => {
    console.log("WebSocket client disconnected");
  });

  setInterval(()=>emitCpuUsage(ws), 3000);
});

const saveCpuUsage = () => {
    const commandCpuUsage = "top -b -n 1 | grep \"Cpu(s)\" | sed \"s/.*, *\\([0-9.]*\\)%* id.*/\\1/\" | awk '{print 100 - $1 \"%\"}'";
    const commandMostIntensiveTask = "top -b -n 1 | head -n 12 | tail -n 1 | awk '{print $12}'"; // Extracts the process name

    exec(commandCpuUsage, async (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return;
        }

        if (stderr) {
            console.error(`stderr: ${stderr}`);
            return;
        }
        
        const usage = stdout.trim();

        exec(commandMostIntensiveTask, async (errorTask, stdoutTask, stderrTask) => {
            if (errorTask) {
                console.error(`exec error for process: ${errorTask}`);
                return;
            }

            if (stderrTask) {
                console.error(`stderr for process: ${stderrTask}`);
                return;
            }

            const mostIntensiveTask = stdoutTask.trim();

            // Save the CPU usage and the most intensive task in your database
            await ServerCpuUsage.create({
                usage,
                most_intensive_task: mostIntensiveTask
            });
        });
    });
};

const emitCpuUsage = (ws) => {
  const command = "top -b -n 1 | grep \"Cpu(s)\" | sed \"s/.*, *\\([0-9.]*\\)%* id.*/\\1/\" | awk '{print 100 - $1 \"%\"}'";

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }

    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return;
    }

    const cpuUsage = stdout.trim(); 

    // Emit the CPU usage over WebSocket to the client
    ws.send(JSON.stringify({ cpu_usage: cpuUsage }));
  });
};

app.use(cors());


app.use((req, res, next) => {
  // Check if the request is for a resource file
  const resourceExtensions = [".css", ".js", ".json", ".png", ".jpg", ".jpeg", ".gif", ".ico", ".svg"];
  const ext = path.extname(req.path);

  if (resourceExtensions.includes(ext)) {
    express.static(path.join(__dirname, "public"))(req, res, next);
  } else {
      if (req.path === "/") {
        return res.redirect("/app");
      } 
      next();
  }
});

app.use('/app', express.static(path.join(__dirname, "public")));
app.get('/app/*', (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});
app.use('/gemini', express.static(path.join(__dirname, "public/gemini")));

app.use(express.json());
app.use((req, res, next) => {
  req.wss = wss;
  next();
});

app.use(authRouter);
app.use(leadsRouter);
app.use(scrapeRouter);
app.use(engagementRouter);
app.use("/api/sections", sectionsRouter);
app.use("/api/mautic", mauticRouter);
app.use("/api", timesheetRouter);
app.use("/api", taskRouter);
app.use("/api", projectRouter);
app.use("/api", workDaysRouter);

app.get("/api/usage-stats", getUsageStats);

/** Admin Routes */
app.use("/api/admin/users", adminUsersRouter);

app.get("/scrap-status", authenticateJWT, getScrapStatus);
app.get("/scrape-logs", authenticateJWT, getScrapLogs);



server.listen(5640, () => {
  sequelize.sync();
  Timesheets.sync();
  ServerCpuUsage.sync();
  // Save CPU Usage every 30 minutes
  setInterval(saveCpuUsage, 1800000);
  // setInterval(saveCpuUsage, 30000);
  console.log("REST API and WebSocket server started on port 3000");
});

