export const logEvent = (event) => {
    console.log(JSON.stringify({
        triggerSource: event?.triggerSource,
        sub: event?.claims?.sub ?? event?.request?.userAttributes?.sub ?? null,
        email: event?.claims?.email ?? event?.request?.userAttributes?.email ?? null,
        path: event?.rawPath,
        body: event?.body,
        queryStringParameters: event?.queryStringParameters,
        httpMethod: event?.httpMethod,
        report: event?.report,
        records: event?.Records,
    }));
}