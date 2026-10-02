const { Type } = require("../models/types.model");
const { Section } = require("../models/sections.model");
const { Leads } = require("../models/leads.model");
const { LeadLinks } = require("../models/lead_links.model");
const SocialMediaStats = require("../models/social_media_stats.model");
const SocialEngagement = require("../models/social_engagement.model");
const { Op, Sequelize } = require("sequelize");
const { EngagementLogs } = require("../models/engagement_logs.model");
const axios = require("axios");
const { MauticLogs } = require("../models/mautic_logs.model");

const mauticInstance = 'https://anvil.joadesigns.co.uk'; 
const mauticUsername = 'john'; 
const mauticPassword = 'More=Worry23'; 

const encoded = Buffer.from(mauticUsername + ':' + mauticPassword).toString('base64');

const getLeads = async (req, res) => {
  try {
  const section = req.params.section && req.params.section.trim();
  const type = req.params.type && req.params.type.trim();
  const country = req.query.country && req.query.country.trim();
  const company = req.query.company && req.query.company.trim();
  const sortBy = req.query.sortBy || "id";
  const sort = req.query.sort || "ASC";

  const { page = 1, limit = 10 } = req.query;

  const offset = (Number(page) - 1) * Number(limit);

  const condition = {};

  if(type && type !== "all") {
    condition.type = type;
  }
  if(section && section !== "all") {
    condition.section = section;
  }
  if(country && country !== "all") {
    condition.country = {[Op.like]: `%${country}%`};
  }
  if(company) {
    condition.name = {[Op.like]: `%${company}%`};
  }

  let order = [];
  if(sortBy === "status") {
    order[0] = "updatedAt";
    order[1] = sort
  } else if(sortBy === "social") {
    order = [Sequelize.literal(
        `(SELECT COUNT(*) FROM engagement_logs WHERE engagement_logs.lead_id = leads.id)`
      ), sort,]
  } else if(sortBy !== "mautic") {
    order[0] = sortBy;
    order[1] = sort;
  } else {
    order[0] = "id";
    order[1] = "ASC";
  }

  const leads = await Leads.findAndCountAll({
    where: condition,
    limit: parseInt(limit, 10),
    offset: parseInt(offset, 10),
    order: [order],
    include: [
        {
          model: EngagementLogs,
          as: "engagementLogs",
          attributes: ["createdAt"],
          required: false,
          limit: 1, 
          order: [["createdAt", "DESC"]], 
        },
      ],
  });

const checkMauticContacts = async (leadIds) => {
  const searchQuery = leadIds.map(id => `lead_id:${id}`).join(' OR ');
  try {

    const response = await axios.get(`${mauticInstance}/api/contacts?search=${searchQuery}`, {
      headers: {
        'Authorization': `Basic ${encoded}`,
        'Content-Type': 'application/json',
      },
    });
    const existingContactIds = Object.values(response.data.contacts).map(c=>{
      return c.fields.all.lead_id;
    });
    return existingContactIds;
  } catch (error) {
    console.error('Error fetching contacts from Mautic:', error);
    return [];
  }
};

  const leadIds = leads.rows.map(lead=>lead.id);

  const contactIds = await checkMauticContacts(leadIds);

  res.status(200).json({
    total: leads.count,
    page: parseInt(page, 10),
    totalPages: Math.ceil(leads.count / limit),
    offset,
    limit,
    leads: leads.rows.map(lead=> {
      return {...lead.toJSON(), mauticStatus: contactIds.includes(lead.id)}
    }).sort((a, b) => {
    if (sortBy === "mautic") {
      if (sort === "ASC") {
        return a.mauticStatus === b.mauticStatus ? 0 : a.mauticStatus ? -1 : 1;
      } else if (sort === "DESC") {
        return a.mauticStatus === b.mauticStatus ? 0 : a.mauticStatus ? 1 : -1;
      }
    }
    return 0; 
  }),
  });
} catch(err) {
  console.error(err);
  res.status(500).json({
    message: "Internal Server Error"
  });
}
};

const sendLeadsToMautic = async (req, res) => {
  const section = req.params.section && req.params.section.trim();
  try {

    if(!section) res.status(400).json({message: "Please provide a section name to send to Mautic!"});

    const { page = 1, limit = 100 } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    const condition = {};

    if (section && section !== "all") {
      condition.section = section;
    }

    const leads = await Leads.findAll({
      where: condition,
      offset: parseInt(offset, 10),
      order: [['id', 'ASC']],
      limit: parseInt(limit, 10)
    });

    const results = leads.map(lead => ({
      id: lead.id,
      lead_id:lead.id,
      email: lead.email,
      firstname: lead.contact ? lead.contact.split(' ')[0] : '', 
      lastname: lead.contact ? lead.contact.split(' ')[1] || '' : '',
      company: lead.name || lead.section, 
      address1: lead?.address?.length > 64 ? lead.address.slice(0, 63) : lead.address,
      phone: lead.mobile || lead.telephone,
      sector: lead.section,
    }));

    const chunkArray = (array, chunkSize) => {
      const chunks = [];
      for (let i = 0; i < array.length; i += chunkSize) {
        chunks.push(array.slice(i, i + chunkSize));
      }
      return chunks;
    };

    const leadChunks = chunkArray(results, 10);

    // Create promises for each chunk
    const chunkPromises = leadChunks.map(chunk =>
      axios.put(
        `${mauticInstance}/api/contacts/batch/edit`,
        chunk,
        {
          headers: {
            'Authorization': `Basic ${encoded}`,
            'Content-Type': 'application/json',
          },
        }
      )
      .then(res=>{
        if(res?.data?.contacts) {
          return Object.values(res.data.contacts).length;
        }
        return 0;
      })
      .catch(error => {
        MauticLogs.create({
          operation: "LEADS_CHUNK_FAILED",
          section,
          leadIds: chunk.map(lead=>lead.id),
          message: `Failed to send leads starting from ${chunk[0].id} to ${chunk[chunk.length - 1].id} of section ${section}.`,
          processed: 0,
          page: parseInt(page, 10)
        });
        console.error(`Failed to send chunk:`, error.response?.data || error.message);
        throw new Error(`Failed to send chunk with first lead ID: ${chunk[0].id}`);
      })
    );

    // Resolve all promises concurrently
    recordsPublished = (await Promise.all(chunkPromises)).reduce((total, count) => total + count, 0);

    if(recordsPublished) await MauticLogs.create({
      section: section,
      operation: 'LEADS_SENT',
      leadIds: results.map(lead => lead.id),
      message: `Successfully processed ${recordsPublished} leads for section ${section}.`,
      processed: recordsPublished,
      page: parseInt(page, 10)
    });

    axios.post(`${mauticInstance}/api/segments/new`, {
          "name": section,
          "alias": section.replace(" ", "-"),
          "isPublished": 1,
          "filters": [
              {
                  "glue": "and",
                  "field": "sector",
                  "object": "lead",
                  "type": "text",
                  "filter": section,
                  "operator": "="
              }
          ]
    }, 
    {
      headers: {
        'Authorization': `Basic ${encoded}`,
        'Content-Type': 'application/json',
      },
    });

    res.status(200).json({
      message: 'Leads processed for Mautic',
      total: results.length,
      processed: recordsPublished
    });
  } catch (err) {
    console.log(err);
      await MauticLogs.create({
        section: section,
        operation: 'LEADS_SENT_ERROR',
        leadIds: [],
        message: `Error occurred: ${err.message}`,
      });
      res.status(500).json({
        message: 'Internal Server Error',
        error: err.message,
      });
  }
};


const getItemNavigation =async function (req, res) {
  try {
    const itemId = req.params.lead_id;
    const currentItem = await Leads.findByPk(itemId);

    if (!currentItem) {
      return res.status(404).json({ message: 'Item not found' });
    }

    const nextItem = await Leads.findOne({
      where: {
        id: {
          [Sequelize.Op.gt]: currentItem.id
        }
      },
      attributes: ['id'],
      order: [['id', 'ASC']]
    });

    const previousItem = await Leads.findOne({
      where: {
        id: {
          [Sequelize.Op.lt]: currentItem.id
        }
      },
      attributes: ['id'],
      order: [['id', 'DESC']]
    });

    res.json({
      nextItemId: nextItem ? nextItem.id : null,
      previousItemId: previousItem ? previousItem.id : null
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
}


const addLinksToLead = async (req, res) => {
  const { id } = req.params; 
  const { facebook, linkedin, contact_linkedin, director_linkedin } = req.body;  

  try {
    const lead = await Leads.findByPk(id);
    if (!lead) {
      return res.status(404).json({ error: "Lead not found" });
    }

    const linksToProcess = [
      { link_type: 'facebook', url: facebook },
      { link_type: 'linkedin', url: linkedin },
      { link_type: 'contact_linkedin', url: contact_linkedin },
      { link_type: 'director_linkedin', url: director_linkedin }
    ];

    for (const link of linksToProcess) {
      if (link.url) { 
        const existingLink = await LeadLinks.findOne({
          where: {
            lead_id: id,
            link_type: link.link_type
          }
        });

        if (existingLink) {
          existingLink.url = link.url;
          await existingLink.save();
        } else {
          await LeadLinks.create({
            lead_id: id,
            link_type: link.link_type,
            url: link.url
          });
        }
      }
    }

    return res.status(200).json({ message: "Links updated successfully", data: { facebook, linkedin, contact_linkedin, director_linkedin } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const getLead = async (req, res) => {
  try {
    const { id } = req.params;

    const lead = await Leads.findByPk(id,  {
      include: [{
        model: LeadLinks,
        as: "lead_links",
      }, 
        {
          model: SocialEngagement,
          as: "lead_engagement",
          include: [
            {
              model: SocialMediaStats,
              as: "linkedin",  
              where: { platform: "linkedin" }, 
              required: false,  
            },
            {
              model: SocialMediaStats,
              as: "facebook",  
              where: { platform: "facebook" },  
              required: false,  
            }
          ],
        }
    ], logging:true
  });

    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    return res.status(200).json(lead);
  } catch (error) {
    console.error('Error retrieving lead:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateLead = async (req, res) => {
    try {
    const { id } = req.params;
    const { name, contact, email, mobile, telephone, address, zip_code } = req.body;
    const lead = await Leads.findByPk(id);

    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    await lead.update({name, contact, email, mobile, telephone, address, zip_code});
    return res.status(200).json(lead);
  } catch (error) {
    console.error('Error updating lead:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getTypesWithLeadsStatus = async (req, res) => {
  try {
    const types = await Type.findAll({
      attributes: ["name"],
    });
    
    const typesWithLeads = await Promise.all(
      types.map(async (type) => {
        const leadExists = await Leads.findOne({
          where: { type: type.name },
          attributes: {
            exclude: ["id"],
          },
        });
        return {
          ...type.toJSON(),
          hasLeads: !!leadExists,
        };
      })
    );

    res.status(200).json({ types: typesWithLeads });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getSectionsWithLeadsStatus = async (req, res) => {
  try {
    const { type } = req.params;
    const condition = {};
    if(type && type.toLowerCase() !== "all") {
      condition.type = type;
    }
    const sections = await Section.findAll({
      attributes: ["name"],
      where: condition,
    });

    const sectionsWithLeads = await Promise.all(
      sections.map(async (section) => {
        const leadExists = await Leads.findOne({
          where: { section: section.name },
          attributes: {
            exclude: ["id"],
          },
        });
        return {
          ...section.toJSON(),
          hasLeads: !!leadExists,
        };
      })
    );

    res.status(200).json({ sections: sectionsWithLeads });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createOrUpdateSocialEngagement = async (req, res) => {
  const { id } = req.params; 
  const { linkedinStats, facebookStats } = req.body;  

  try {
    const lead = await Leads.findByPk(id);
    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    const [linkedin, linkedinCreated] = await SocialMediaStats.findOrCreate({
      where: { platform: "linkedin" },
      defaults: linkedinStats,  
    });

    if (!linkedinCreated) {
      await linkedin.update(linkedinStats);  
    }

    const [facebook, facebookCreated] = await SocialMediaStats.findOrCreate({
      where: { platform: "facebook" },
      defaults: facebookStats, 
    });

    if (!facebookCreated) {
      await facebook.update(facebookStats);  
    }

    let socialEngagement = await SocialEngagement.findOne({
      where: { lead_id: lead.id },
    });

    if (socialEngagement) {
      socialEngagement.linkedin_stats = linkedin.id;
      socialEngagement.facebook_stats = facebook.id;

      await socialEngagement.save();  
      return res.status(200).json({ socialEngagement });
    } else {
      socialEngagement = await SocialEngagement.create({
        lead_id: lead.id,
        linkedin_stats: linkedin.id,
        facebook_stats: facebook.id,
      });

      return res.status(201).json({ socialEngagement });
    }

  } catch (err) {
    console.error("Error creating or updating social engagement:", err);
    return res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
};

const getTopSectionsWithEngagementStats = async (req, res) => {
  try {
    const sectionsWithStats = await Leads.findAll({
      attributes: [
        "section",
        [Sequelize.fn("COUNT", Sequelize.col("leads.id")), "totalLeads"],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal(
              "(SELECT COUNT(*) FROM engagement_logs WHERE engagement_logs.lead_id = leads.id)"
            )
          ),
          "engagedLeadsCount",
        ],
      ],
      group: ["section"],
      having: Sequelize.literal("SUM((SELECT COUNT(*) FROM engagement_logs WHERE engagement_logs.lead_id = leads.id)) > 0"),
      order: [[Sequelize.literal("engagedLeadsCount"), "DESC"]],
      limit: 10,
    });

    res.status(200).json(sectionsWithStats);
  } catch (err) {
    console.error("Error fetching top sections with engagement stats:", err);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: err.message });
  }
};

module.exports = {
  getLeads,
  getTypesWithLeadsStatus,
  getSectionsWithLeadsStatus,
  getLead,
  updateLead,
  addLinksToLead,
  createOrUpdateSocialEngagement,
  getItemNavigation,
  sendLeadsToMautic,
  getTopSectionsWithEngagementStats
};
