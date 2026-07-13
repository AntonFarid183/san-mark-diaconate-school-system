namespace DiaconateSchool.Application;

// Single place to tune the business-rule cutoffs used by the Student Performance
// Dashboard, so they can be adjusted later without touching the aggregation logic.
public static class PerformanceThresholds
{
    public const decimal FollowUpPercentage = 60m;
}
