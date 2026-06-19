using System;
using System.Collections.Generic;
using UnityEngine;

namespace FishGame.Net
{
    /// <summary>
    /// Allows background threads (e.g. the WebSocket receive loop) to safely
    /// execute code on the Unity main thread.
    ///
    /// Usage (from any thread):
    ///     UnityMainThreadDispatcher.Enqueue(() => someGameObject.SetActive(true));
    ///
    /// The queued actions are drained inside Update(), which runs on the main thread.
    /// This script must exist in every scene that uses networking; the simplest way
    /// is to attach it to the same persistent GameObject as WsClient.
    /// </summary>
    public class UnityMainThreadDispatcher : MonoBehaviour
    {
        private static readonly Queue<Action> _queue = new Queue<Action>();
        private static readonly object        _lock  = new object();

        /// <summary>Enqueues an action to be executed on the main thread on the next frame.</summary>
        public static void Enqueue(Action action)
        {
            if (action == null) return;
            lock (_lock)
            {
                _queue.Enqueue(action);
            }
        }

        private void Update()
        {
            // Drain the queue — swap under lock to avoid holding the lock during execution.
            int count;
            Action[] snapshot;

            lock (_lock)
            {
                count = _queue.Count;
                if (count == 0) return;
                snapshot = _queue.ToArray();
                _queue.Clear();
            }

            for (int i = 0; i < count; i++)
            {
                try
                {
                    snapshot[i].Invoke();
                }
                catch (Exception ex)
                {
                    Debug.LogError($"[MainThreadDispatcher] Exception in queued action: {ex}");
                }
            }
        }
    }
}
