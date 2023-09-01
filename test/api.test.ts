import request from "supertest";
import app from "../src/app";

describe("GET /auth/checkauth", () => {
    it("should return 200 OK", () => {
        return request(app).get("/auth/checkauth")
            .expect(200);
    });
});
