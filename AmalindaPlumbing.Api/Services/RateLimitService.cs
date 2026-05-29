using System.Collections.Concurrent;

namespace AmalindaPlumbing.Api.Services;

public class RateLimitService
{
    private readonly ConcurrentDictionary<string, Queue<DateTime>> _windows = new();
    private const int MaxMessages = 20;
    private static readonly TimeSpan Window = TimeSpan.FromHours(1);

    public bool IsAllowed(string phone)
    {
        var now = DateTime.UtcNow;
        var queue = _windows.GetOrAdd(phone, _ => new Queue<DateTime>());

        lock (queue)
        {
            while (queue.Count > 0 && now - queue.Peek() > Window)
                queue.Dequeue();

            if (queue.Count >= MaxMessages)
                return false;

            queue.Enqueue(now);
            return true;
        }
    }
}
