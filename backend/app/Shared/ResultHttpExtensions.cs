namespace Dersakis.Shared;

public static class ResultHttpExtensions
{
    public static IResult ToProblem(this Result result)
    {
        var e = result.Error ?? Error.Failure("unknown", "Bilinmeyen hata.");
        var status = e.Type switch
        {
            ErrorType.Validation => StatusCodes.Status400BadRequest,
            ErrorType.Unauthorized => StatusCodes.Status401Unauthorized,
            ErrorType.Forbidden => StatusCodes.Status403Forbidden,
            ErrorType.NotFound => StatusCodes.Status404NotFound,
            ErrorType.Conflict => StatusCodes.Status409Conflict,
            ErrorType.TooManyRequests => StatusCodes.Status429TooManyRequests,
            _ => StatusCodes.Status500InternalServerError
        };

        return Results.Problem(statusCode: status, title: e.Code, detail: e.Message);
    }

    public static IResult Match<T>(this Result<T> result, Func<T, IResult> onSuccess)
        => result.IsSuccess ? onSuccess(result.Value) : result.ToProblem();

    public static IResult Match(this Result result, Func<IResult> onSuccess)
        => result.IsSuccess ? onSuccess() : result.ToProblem();
}