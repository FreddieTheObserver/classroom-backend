import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '../src/utils/password';

describe("password utils", () => {
    it("hashPassword produces a hash that is not the plain password", async () => {
        const hash = await hashPassword("hunter2");
        expect(hash).not.toBe("hunter2");
        expect(hash.length).toBeGreaterThan(20);
    });

    it("verifyPassword returns true for the correct password", async () => {
        const hash = await hashPassword("hunter2");
        expect(await verifyPassword("hunter2", hash)).toBe(true);
    });

    it("verifyPassword returns false for a wrong password", async () => {
        const hash = await hashPassword("hunter2");
        expect(await verifyPassword("wrong", hash)).toBe(false);
    })
})