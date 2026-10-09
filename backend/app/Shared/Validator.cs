namespace Dersakis.Shared;

public sealed class Validator
{
    private readonly List<string> _errors = [];

    public Validator Check(bool condition, string message)
    {
        if (!condition) _errors.Add(message);
        return this;
    }

    public Error? ToError()
        => _errors.Count == 0 ? null : Error.Validation("validation_failed", string.Join(" ", _errors));
}