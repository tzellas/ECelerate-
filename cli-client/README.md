# CLI - Client
## CLI Commands
To run the client, use this command:
```bash
python3 se2525 <scope> --params
```
The following command displays all available scopes:
```bash
python3 se2525 --help
```
to see detailed information about the parameters of a specific <scope>, use the command:
```bash
python3 se2525 <scope> --help
```
The available commands are:
```bash
# Admin
python3 se2525 healthcheck
python3 se2525 resetpoints
python3 se2525 addpoints --source 

# Points
python3 se2525 points --format
python3 se2525 points --format
python3 se2525 points --status --format 
python3 se2525 points --status --format 

# Single point
python3 se2525 point --id

# Reserve
python3 se2525 reserve --id
python3 se2525 reserve --id --minutes

# Update point
python3 se2525 updpoint --id --status --price
python3 se2525 updpoint --id --status
python3 se2525 updpoint --id --price

# New session
python3 /home/apostolos/softeng/softeng25-25/cli-client/se2525.py newsession \
  --id  \
  --starttime \
  --endtime \
  --startsoc \
  --endsoc \
  --totalkwh \
  --kwhprice \
  --amount

# Sessions
python3 se2525 sessions --id --from --to --format
python3 se2525 sessions --id --from --to --format

# Point status
python3 se2525 pointstatus --id --from --to --format
python3 se2525 pointstatus --id --from --to --format
```
**Note:** For the cli file to be used we need to be in its directory and run the commands from there.
