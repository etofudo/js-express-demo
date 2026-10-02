const sequelize = require("../database");

const getPopulatedSections = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const results = await sequelize.query(`
      SELECT sections.name, COUNT(leads.id) AS lead_count
      FROM sections
      LEFT JOIN leads ON leads.section = sections.name
      GROUP BY sections.name
      HAVING COUNT(leads.id) > 0
      ORDER BY lead_count DESC
      LIMIT :limit
    `, {
      replacements: { limit },
      type: sequelize.QueryTypes.SELECT
    });
    
    res.status(200).json(results);
  } catch (error) {
    console.error("Error fetching populated sections:", error);
    res.status(500).json({ message: "An error occurred", error: error.message });
  }
};

module.exports = { getPopulatedSections };