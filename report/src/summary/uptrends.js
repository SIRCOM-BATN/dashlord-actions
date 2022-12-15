/** @param {UpTrendsReport} report */
const summary = (report) => {
  if (report) {
    const monitorGuid = report.monitorGuid;
    if (monitorGuid !== undefined && monitorGuid !== null) {
      return {
        uptrendsUptime: report.currentYear.uptime,
        uptrendsUptimeGrade: report.currentYear.uptimeGrade
      };
    }
  }
};

module.exports = summary;
