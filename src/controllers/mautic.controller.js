const { Sequelize } = require("sequelize");
const { MauticLogs } = require("../models/mautic_logs.model");
const { Section } = require("../models/sections.model");
const axios = require("axios");

const mauticInstance = 'https://anvil.joadesigns.co.uk';
const mauticUsername = 'john';
const mauticPassword = 'More=Worry23';

const encoded = Buffer.from(mauticUsername + ':' + mauticPassword).toString('base64');

const mauticSequelize = new Sequelize("mautic", "root", "?Abcd1234", {
    host: "localhost",
    port: 3306,
    dialect: "mysql",
    // logging: true,
    dialectOptions: {
        connectTimeout: 120000
    },
    pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
    },
});

const getMauticLogs = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    try {
        const { count, rows } = await MauticLogs.findAndCountAll({
            order: [["createdAt", "DESC"]],
            include: {
                model: Section,
                attributes: ["name"],
                as: "section_name"
            },
            limit: limit,
            offset: offset,
        });

        res.status(200).json({
            logs: rows,
            total: count,
            totalPages: Math.ceil(count / limit),
            offset,
            currentPage: page,
            pageSize: limit,
        });
    } catch (error) {
        console.error('Error fetching Mautic logs:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// const getMauticCampaigns = async (req, res) => {
//     try {
//         const response = await axios.get(`${mauticInstance}/api/campaigns?orderBy=dateAdded&orderByDir=desc`, {
//             headers: {
//                 'Authorization': `Basic ${encoded}`,
//                 'Content-Type': 'application/json',
//             },
//         });

//         if (response.status !== 200) {
//             return res.status(500).json({ message: "Internal Server Error" });
//         }

//         let campaigns = Object.values(response.data.campaigns);
//         const resp = await axios.get(`${mauticInstance}/api/emails?orderBy=dateAdded&orderByDir=desc`, {
//             headers: {
//                 'Authorization': `Basic ${encoded}`,
//                 'Content-Type': 'application/json',
//             },
//         });
//         const emailsData = resp.data;

//         for (let i = 0; i < campaigns.length; i++) {
//             const events = campaigns[i].events || [];

//             const emailIds = Array.from(
//                 events
//                     .filter(e => e.type === "email.send" && e.properties?.email && e.eventType === "action")
//                     .map(e => ({ id: e.properties.email, email_name: e.name, order: e.order }))
//                     .sort((a, b) => (a.order - 1) - (b.order - 1))
//                     .reduce((acc, item) => acc.set(item.id, item), new Map())
//                     .values());

//             if (emailIds.length === 0) {
//                 campaigns[i].emailStats = [];
//                 continue;
//             }
//             campaigns[i].emailStats = await getEmailStats(emailIds, emailsData.emails)
//         }

//         res.status(200).json({
//             campaigns: campaigns.sort((a, b) => {
//                 if (b.isPublished !== a.isPublished) {
//                     return b.isPublished - a.isPublished;
//                 }
//                 return new Date(b.dateAdded) - new Date(a.dateAdded);
//             })
//         });

//     } catch (err) {
//         console.log(err);

//         console.error(err);
//         res.status(500).json({ message: "Internal Server Error", err });
//     }
// };

const getMauticCampaigns = async (req, res) => {
    try {
        const campaignUrl = `${mauticInstance}/api/campaigns?orderBy=dateAdded&orderByDir=desc`;
        const response = await axios.get(campaignUrl, {
            headers: {
                'Authorization': `Basic ${encoded}`,
                'Content-Type': 'application/json',
            },
            timeout: 5000, // Optional: Set timeout for API requests
        });

        if (response.status !== 200) {
            console.error(`Campaign API Error: Status ${response.status}`);
            return res.status(500).json({ message: "External Campaign API is not working" });
        }

        let campaigns = Object.values(response.data.campaigns);

        const emailUrl = `${mauticInstance}/api/emails?orderBy=dateAdded&orderByDir=desc`;
        const resp = await axios.get(emailUrl, {
            headers: {
                'Authorization': `Basic ${encoded}`,
                'Content-Type': 'application/json',
            },
            timeout: 5000,
        });

        if (resp.status !== 200) {
            console.error(`Email API Error: Status ${resp.status}`);
            return res.status(500).json({ message: "External Email API is not working" });
        }

        const emailsData = resp.data;

        for (let i = 0; i < campaigns.length; i++) {
            const events = campaigns[i].events || [];
            const emailIds = Array.from(
                events
                    .filter(e => e.type === "email.send" && e.properties?.email && e.eventType === "action")
                    .map(e => ({ id: e.properties.email, email_name: e.name, order: e.order }))
                    .sort((a, b) => (a.order - 1) - (b.order - 1))
                    .reduce((acc, item) => acc.set(item.id, item), new Map())
                    .values());

            if (emailIds.length === 0) {
                campaigns[i].emailStats = [];
                continue;
            }

            campaigns[i].emailStats = await getEmailStats(emailIds, emailsData.emails);
        }

        res.status(200).json({
            campaigns: campaigns.sort((a, b) => {
                if (b.isPublished !== a.isPublished) {
                    return b.isPublished - a.isPublished;
                }
                return new Date(b.dateAdded) - new Date(a.dateAdded);
            }),
        });

    } catch (err) {
        if (err.response) {
            // API responded with an error
            console.error(`API Error [${err.response.status}]: ${err.response.statusText}`, err.response.data);
            return res.status(500).json({
                message: `External API is not working [${err.config.url}]`,
                error: err.response.data,
            });
        } else if (err.request) {
            // No response received
            console.error(`No response from API: ${err.config.url}`, err.request);
            return res.status(500).json({
                message: `No response from External API [${err.config.url}]`,
            });
        } else {
            // Internal server error
            console.error("Internal Error:", err.message);
            return res.status(500).json({
                message: "Internal Server Error",
                error: err.message,
            });
        }
    }
};

const getEmailStats = async (emailIds, emailsData) => {
    try {
        const stats = [];
        const emails = Object.values(emailsData);
        for (let i = 0; i < emailIds.length; i++) {
            const index = emails.findIndex(e => e.id == emailIds[i].id);
            if (index > -1) {
                stats.push({ ...emails[index], email_name: emailIds[i].email_name });
            }
        }
        // for(let i=0; i < emails.length; i++) {
        //     const index = ids.map(e=>Number(e.id)).indexOf(emails[i].id);

        //     if(index > -1) {
        //         if(emails[i].id === 37) console.log(index, emails[i].name, ids[index].email_name);
        //         stats.push({...emails[i], email_name: ids[index].email_name})
        //     }
        // }
        return stats;
    } catch (err) {
        console.error("Error fetching email stats", err);
        return [];
    }
};

const getMauticCampaignEmails = async (req, res) => {
    const { ids, sortBy = 'email_name', sortOrder = 'asc' } = req.query;
    const idArray = ids.split(",").map(id => parseInt(id.trim(), 10));

    try {
        const emailStats = await mauticSequelize.query(
            `
            SELECT 
                e.id AS email_id, 
                e.name AS email_name, 
                e.subject AS email_subject, 
                s.lead_id, 
                l.firstname AS lead_firstname, 
                l.lastname AS lead_lastname, 
                l.company AS lead_company,
                l.email AS lead_email,
                s.is_read, 
                s.date_read,
                s.is_failed,
                s.date_sent,
                dnc.reason AS unsubscribe_reason,
                dnc.date_added AS unsubscribe_date,
                GROUP_CONCAT(ll.name) AS subscription_lists
            FROM emails e
            INNER JOIN email_stats s ON e.id = s.email_id
            INNER JOIN leads l ON s.lead_id = l.id
            LEFT JOIN lead_donotcontact dnc ON l.id = dnc.lead_id 
            LEFT JOIN lead_ips_xref llx ON l.id = llx.lead_id  
            LEFT JOIN lead_lists ll ON llx.lead_id = ll.id  
            WHERE e.id IN (:idArray)
            GROUP BY e.id, e.name, e.subject, s.lead_id, l.firstname, l.lastname, l.company, l.email, s.is_read, s.date_read, s.is_failed, s.date_sent, dnc.reason, dnc.date_added
ORDER BY s.date_read DESC;`,
            {
                replacements: { idArray },
                type: mauticSequelize.QueryTypes.SELECT
            }
        );

        const sortFields = {
            lead_firstname: 'lead_firstname',
            lead_company: 'lead_company',
            lead_email: 'lead_email',
            is_read: 'is_read',
            is_failed: 'is_failed',
            date_sent: 'date_sent',
            date_read: 'date_read',
            unsubscribe_date: 'unsubscribe_date'
        };

        const sortField = sortFields[sortBy] || 'email_name';
        const order = sortOrder === 'DESC' ? -1 : 1;

        emailStats.sort((a, b) => {
            if (a[sortField] < b[sortField]) return -order;
            if (a[sortField] > b[sortField]) return order;
            return 0;
        });

        res.status(200).json({ emailStats });
    } catch (err) {
        console.error("Error fetching email stats:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
};


module.exports = { getMauticLogs, getMauticCampaigns, getMauticCampaignEmails }