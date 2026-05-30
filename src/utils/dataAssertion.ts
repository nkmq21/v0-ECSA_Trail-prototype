import { AppErrorCodes, GenericResponse } from "@/lib/errors";

export class DataAssertionError extends Error {
    readonly code: AppErrorCodes;

    constructor(message: string, code: AppErrorCodes) {
        super(message);
        this.name = "DataAssertionError";
        this.code = code;
    }
}

/**
 * Unwraps a GenericResponse, throwing DataAssertionError on error type.
 * Use when you want to propagate errors as exceptions rather than checking manually.
 */
export function dataAssertion<T>(response: GenericResponse<T>): T {
    if (response.type === "error") {
        throw new DataAssertionError(
            response.message ?? "An unknown error occurred",
            response.code as AppErrorCodes
        );
    }
    return response.data;
}
