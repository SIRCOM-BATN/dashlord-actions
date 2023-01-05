/** @param {UpTrendsReport} report */
const summary = (report) => {
  if (report) {
    const monitorGuid = report.monitorGuid;
    if (monitorGuid !== undefined && monitorGuid !== null) {
      return {
        uptrendsUptime: report.last30Days.uptime,
        uptrendsUptimeGrade: report.last30Days.uptimeGrade
      };
    }
  }
};

module.exports = summary;
