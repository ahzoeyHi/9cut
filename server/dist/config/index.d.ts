export declare const config: {
    port: number;
    nodeEnv: string;
    database: {
        path: string;
    };
    storage: {
        uploadDir: string;
        generatedDir: string;
        maxFileSize: string;
    };
    ai: {
        defaultService: string;
    };
    security: {
        encryptionSecret: string;
    };
    logging: {
        level: string;
    };
    getAbsolutePath(relativePath: string): string;
};
//# sourceMappingURL=index.d.ts.map