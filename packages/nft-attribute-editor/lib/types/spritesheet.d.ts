export type SpritesheetData = {
    frames: {
        [frame: string]: {
            frame: {
                x: number;
                y: number;
                w: number;
                h: number;
            };
        };
    };
    meta: {
        scale: number | string;
    };
    animations?: {
        [key: string]: string[];
    };
};
//# sourceMappingURL=spritesheet.d.ts.map