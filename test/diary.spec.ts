import * as moment from "moment";
import { getAdjustedDateForTimeCutoff } from "../src/utils/diary";

describe("getAdjustedDateForTimeCutoff", () => {
    const standardCutoff = "04:00";

    it("returns previous day if before cutoff (03:59)", () => {
        const date = moment("2025-10-24T03:59:00");
        const result = getAdjustedDateForTimeCutoff(date, standardCutoff);
        expect(result.format("YYYY-MM-DD")).toBe("2025-10-23");
    });

    it("returns same day if exactly at cutoff (04:00)", () => {
        const date = moment("2025-10-24T04:00:00");
        const result = getAdjustedDateForTimeCutoff(date, standardCutoff);
        expect(result.format("YYYY-MM-DD")).toBe("2025-10-24");
    });

    it("consistently switches day only once around cutoff", () => {
        const cutoff = "04:00";
        const times = Array.from({ length: 24 }, (_, h) =>
            moment(`2025-10-24T${String(h).padStart(2, "0")}:00:00`)
        );
        const results = times.map((date) =>
            getAdjustedDateForTimeCutoff(date, cutoff).format("YYYY-MM-DD")
        );
        expect(results.slice(0, 4).every((d) => d === "2025-10-23")).toBe(true);
        expect(results.slice(4).every((d) => d === "2025-10-24")).toBe(true);
    });
});
