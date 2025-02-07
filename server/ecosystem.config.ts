module.exports = {
    apps: [
        {
            name: 'Swing Slots Server',
            script: 'index.js',
            env: {
                NODE_ENV: process.env.NODE_ENV || 'development',
                PORT: process.env.PORT || 4000,
            },
            env_production: {
                NODE_ENV: process.env.NODE_ENV || 'production',
                PORT: process.env.PORT || 4000,
            },
        },
    ],
};
