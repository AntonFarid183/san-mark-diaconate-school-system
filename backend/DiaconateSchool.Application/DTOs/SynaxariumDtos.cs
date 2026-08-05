namespace DiaconateSchool.Application.DTOs;

public class SynaxariumEntryDto
{
    public string Title { get; set; } = string.Empty;
    public string Story { get; set; } = string.Empty;
}

public class SynaxariumDayDto
{
    // e.g. "29- اليوم التاسع والعشرين - شهر أبيب"
    public string DayHeading { get; set; } = string.Empty;
    // Opening blessing paragraph ("أحسن الله استقباله...")
    public string Blessing { get; set; } = string.Empty;
    public List<SynaxariumEntryDto> Saints { get; set; } = new();
    // True when this is a cached/last-known-good result served because the
    // live fetch failed — lets the frontend show a small "قد لا يعكس اليوم" hint.
    public bool IsStale { get; set; }
}
