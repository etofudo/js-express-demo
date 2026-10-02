const { exec } = require("child_process");
const WebSocket = require("ws");
const { setScrapingState } = require("./scrappingState");

const scrapeLead = async (req, res) => {
  const { web_link, section } = req.body;
  const pythonScriptPath = "../../python-scrapper/scrap-lead.py";
  const command = `python3 "${pythonScriptPath}" "${web_link}" "${section}"`;
    exec(command, (error, stdout, stderr) => {
      if(stderr) {
        console.log(stderr);
        res.status(500).json({message: "Internal Server Error"});
        return null;
      }
      console.log(stdout);
      res.status(200).json({message: "Lead updated successfully!"});
    });
}

const scrapeQueue = []; // Queue to hold scraping requests
let isScrapingInProgress = false; // Flag to track ongoing scraping

const processNextInQueue = (req) => {
  if (scrapeQueue.length === 0) {
    isScrapingInProgress = false;
    return;
  }

  const { country, type, section, userId, wss, redis } = scrapeQueue.shift();
  isScrapingInProgress = true;

  const pythonScriptPath = "../../python-scrapper/scraper.py";
  const command = `python3 "${pythonScriptPath}" "${country}" "${type}" "${section}"`;

  setScrapingState(userId, `${country}::${type}::${section}`, "IN_PROGRESS");

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(
        JSON.stringify({ country, type, section, status: "started" })
      );
    }
  });

  exec(command, (error, stdout, stderr) => {
    if (error || stderr) {
      console.error(`Scraping error: ${error?.message || stderr}`);
      setScrapingState(userId, `${country}::${type}::${section}`, "FAILED");
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(
            JSON.stringify({
              country,
              type,
              section,
              status: "error",
              error: "Error while scraping data",
            })
          );
        }
      });
    } else {
      setScrapingState(userId, `${country}::${type}::${section}`, "COMPLETED");
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(
            JSON.stringify({ country, type, section, status: "completed" })
          );
        }
      });
    }
    setTimeout(()=>processNextInQueue(req), 25000); 
  });
};

const scrapeLeads = async (req, res) => {
  const { country, type, section } = req.params;
  const userId = req.user.id;

  if(scrapeQueue.length >= 199) {
    res.status(400).json({
      message: "No more than 100 processes can be queued at the same time. Please wait for a process to complete!"
    });
  }

  scrapeQueue.push({ country, type, section, userId, wss: req.wss, redis: req.redis });

  if (!isScrapingInProgress) {
    processNextInQueue(req);
  }

  res.status(200).json({
    message: "Your request has been queued and will be processed shortly.",
    queuePosition: scrapeQueue.length,
    country,
    type,
    section,
  });
};

module.exports = { scrapeLeads, scrapeLead };
