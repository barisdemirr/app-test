namespace Dersakis.Domain.Enums;

/// <summary>DB'de tinyint. Mevcut numaralar değişmez.</summary>
public enum QaMode : byte { Text = 1, Voice = 2 }

public enum QaChosenBy : byte { Asker = 1, Auto = 2 }