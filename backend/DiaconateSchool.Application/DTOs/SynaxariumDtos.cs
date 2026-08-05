namespace DiaconateSchool.Application.DTOs;

public class SynaxariumEntryDto
{
    public string Title { get; set; } = string.Empty;
    public string Story { get; set; } = string.Empty;
    // Best-effort — matched by title from a second source that carries saint
    // icons; null when no confident match was found (frontend falls back to
    // a plain icon badge in that case).
    public string? ImageUrl { get; set; }
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
