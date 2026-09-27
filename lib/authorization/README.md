# Authorization boundary

Server-side authorization helpers will live here. Every protected mutation must
validate actor, action, resource, and organization or exam-center scope before
starting a database transaction.
