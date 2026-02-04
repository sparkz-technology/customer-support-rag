# A2A Ticket Fix Protocol (Implementation Guide)

This app now exposes a Google A2A‑compatible endpoint to let agents analyze and fix tickets via agent‑to‑agent calls.

## Endpoints
- Agent Card: `/.well-known/agent-card.json`
- A2A JSON‑RPC: `/api/a2a`

## Auth
Use the same JWT Bearer token as the rest of the API:

```
Authorization: Bearer <access_token>
```

Only `agent` and `admin` roles can call the A2A endpoint.

## Supported Methods
- `message/send`
- `tasks/get`
- `tasks/list`
- `tasks/cancel`

Streaming methods are currently not supported.

## Payload Format (JSON‑RPC)

### 1) Analyze a Ticket (Advisory Only)
```json
{
  "jsonrpc": "2.0",
  "id": "req-1",
  "method": "message/send",
  "params": {
    "message": {
      "role": "user",
      "parts": [
        {
          "type": "data",
          "data": {
            "ticketId": "64f1a2b3c4d5e6f7890abcde"
          }
        }
      ]
    }
  }
}
```

### 2) Apply Updates (Admin Optional Remark, Agent Required Remark)
```json
{
  "jsonrpc": "2.0",
  "id": "req-2",
  "method": "message/send",
  "params": {
    "message": {
      "role": "user",
      "parts": [
        {
          "type": "data",
          "data": {
            "ticketId": "64f1a2b3c4d5e6f7890abcde",
            "applyChanges": true,
            "updates": {
              "status": "in-progress",
              "priority": "high"
            },
            "remark": "Customer confirmed issue still happening"
          }
        }
      ]
    }
  }
}
```

### 3) Get a Task
```json
{
  "jsonrpc": "2.0",
  "id": "req-3",
  "method": "tasks/get",
  "params": { "id": "<task-id>" }
}
```

### 4) List Tasks
```json
{
  "jsonrpc": "2.0",
  "id": "req-4",
  "method": "tasks/list",
  "params": { "pageSize": 20 }
}
```

### 5) Cancel a Task
```json
{
  "jsonrpc": "2.0",
  "id": "req-5",
  "method": "tasks/cancel",
  "params": { "id": "<task-id>" }
}
```

## Response Shape
`message/send` returns a Task with artifacts and history. The final response includes:

- `suggestedResponse`: AI‑generated reply text
- `proposedUpdates`: non‑applied recommendations
- `appliedUpdates`: actual changes if `applyChanges: true`

## Notes
- `remark` is **required** when the caller is an agent.
- System messages are appended to the ticket conversation so users/admins/assignees can see who changed what and why.
