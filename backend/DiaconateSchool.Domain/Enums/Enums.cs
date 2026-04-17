namespace DiaconateSchool.Domain.Enums;

/// <summary>
/// Defines the system access levels.
/// </summary>
public enum Role
{
    Admin = 1,
    Servant = 2,
    Student = 3
}

/// <summary>
/// Specifies the gender of the student.
/// </summary>
public enum Gender
{
    Male = 1,
    Female = 2
}

/// <summary>
/// Represents the educational stage of the student.
/// </summary>
public enum Stage
{
    KG = 1,
    Primary = 2,
    Preparatory = 3,
    Secondary = 4
}

/// <summary>
/// Defines the ecclesiastical rank of a deacon.
/// </summary>
public enum DeaconRank
{
    Epsaltos = 1,   // Chanter
    Oghnostos = 2,  // Reader
    Epediakon = 3,  // Subdeacon
    Diakon = 4      // Deacon
}
