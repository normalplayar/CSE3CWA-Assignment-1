const BASE = "/api/quotes";

export class ApiError extends Error {
    constructor(message, status, errors = {}){
        super(message);
        this.status = status;
        this.errors = errors
    };
};

async function request(path = "", options = {}) {
    let res;
    try {
        res = await fetch(BASE + path, {
            headers: { "Content-Type": "application/json"},
            ...options,
        });
    }
    catch {
        throw new ApiError("Can't reach the server; check the backend is running.", 0);
    };

    if (res.status === 204){
        return null;
    };

    const body = await res.json().catch(() => null);
    if (!res.ok){
        const errors = body?.errors ?? {};
        throw new ApiError(errors._form ?? `The server returned an error (${res.status}).`, res.status, errors)
    };
    return body;
};

export const listQuotes = () => request();
export const getQuote = (id) => request(`/${id}`);
export const createQuote = (data) => request("", { method: "POST", body: JSON.stringify(data)});
export const updateQuote = (id, data) => request(`/${id}`, {method: "PUT", body: JSON.stringify(data)});
export const deleteQuote = (id) => request(`/${id}`, {method: "DELETE"});