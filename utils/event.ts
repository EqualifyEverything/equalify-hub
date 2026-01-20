export let event = {
    httpMethod: '',
    path: '',
    requestContext: {},
    body: null,
    rawBody: null as string | null, // Preserve raw body for webhooks
    queryStringParameters: null,
    headers: {},
    triggerSource: null,
    request: {},
    response: {},
    claims: {},
};

export const setEvent = (rawEvent) => {
    try {
        !rawEvent.path ? rawEvent.path = rawEvent.rawPath : null;
        // Preserve raw body for webhook signature verification
        rawEvent.rawBody = rawEvent.body;
        if (rawEvent.body && typeof rawEvent.body === 'string') {
            try {
                rawEvent.body = JSON.parse(rawEvent.body);
            } catch {
                // Keep as string if not valid JSON
            }
        }
        !rawEvent.httpMethod ? rawEvent.httpMethod = rawEvent.requestContext?.http?.method : null;
    }
    catch { }

    event = rawEvent;
    return event;
}