# Exact prepublication Git history

FEDMOGA_V3_PREPUBLICATION.bundle contains all original V2 source commits and local tested V3 implementation/documentation commits through 46c5e4f. It contains committed source only, not database records, environment secrets, installed dependencies or build output.

GitHub API publication has separate remote ancestry because CLI authentication is unavailable and the separate repository does not contain the source commit objects. The archive preserves the original commit identities and full history without overwriting the remote initialization.

Restore this historical checkout with:
```sh
git clone -b development/v3 docs/history/FEDMOGA_V3_PREPUBLICATION.bundle recovered-prepublication
```
The archive ends before the publication notes and archive file itself were added. Continue current development from the remote development/v3 branch, not from the historical checkout, unless deliberately restoring it.
