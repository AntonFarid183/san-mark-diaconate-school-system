using Microsoft.Extensions.Logging;
using System;
using System.IO;

namespace DiaconateSchool.Infrastructure.Services;

public static class UploadsLocationMigrator
{
    /// <summary>
    /// One-time rescue for uploads that used to be written inside the deployable
    /// folder ({ContentRoot}/uploads). On App Service a deploy replaces
    /// /home/site/wwwroot wholesale, so anything still sitting there is one deploy
    /// away from being erased.
    ///
    /// Copies (never moves) whatever survives to the persistent location and skips
    /// files already present at the destination, so it is safe to run on every
    /// boot and safe to run when the two paths are the same. Leaving the originals
    /// in place means a half-finished run can simply be repeated.
    ///
    /// Never throws: a failed rescue must not stop the app from starting.
    /// </summary>
    public static void MigrateLegacyUploads(string legacyPath, string currentPath, ILogger logger)
    {
        try
        {
            // Local dev resolves both to the same directory — nothing to do.
            if (string.Equals(
                    Path.TrimEndingDirectorySeparator(legacyPath),
                    Path.TrimEndingDirectorySeparator(currentPath),
                    StringComparison.OrdinalIgnoreCase))
                return;

            if (!Directory.Exists(legacyPath)) return;

            var files = Directory.GetFiles(legacyPath, "*", SearchOption.AllDirectories);
            if (files.Length == 0) return;

            int copied = 0, alreadyPresent = 0;

            foreach (var source in files)
            {
                var relative = Path.GetRelativePath(legacyPath, source);
                var destination = Path.Combine(currentPath, relative);

                if (File.Exists(destination))
                {
                    alreadyPresent++;
                    continue;
                }

                var destinationDir = Path.GetDirectoryName(destination);
                if (!string.IsNullOrEmpty(destinationDir))
                    Directory.CreateDirectory(destinationDir);

                File.Copy(source, destination);
                copied++;
            }

            if (copied > 0)
                logger.LogWarning(
                    "Uploads rescue: copied {Copied} file(s) from the old location {Legacy} to {Current}. " +
                    "{AlreadyPresent} file(s) were already there. The originals were left in place and can be " +
                    "deleted once the site has been verified.",
                    copied, legacyPath, currentPath, alreadyPresent);
            else
                logger.LogInformation(
                    "Uploads rescue: nothing to copy — all {AlreadyPresent} file(s) in {Legacy} already exist in {Current}.",
                    alreadyPresent, legacyPath, currentPath);
        }
        catch (Exception ex)
        {
            logger.LogError(ex,
                "Uploads rescue from {Legacy} to {Current} failed. Uploaded files may still only exist in the old " +
                "location, which a deploy can erase — copy them manually before deploying again.",
                legacyPath, currentPath);
        }
    }
}
