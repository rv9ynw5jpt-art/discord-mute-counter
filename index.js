const { Client, GatewayIntentBits } = require('discord.js');

// We starten de bot met de juiste rechten om mutes/timeouts te kunnen zien
const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildModerations
    ] 
});

// Een tijdelijke teller in het geheugen van de bot
const muteCounts = {}; 

// --- VUL HIER JOUW DISCORD ID'S IN ---
const TARGET_CHANNEL_ID = '1538361511964311653'; // Het ID van het tekstkanaal waar de teller staat
const LOG_MESSAGE_ID = '1538361603831889980';    // Het ID van het specifieke bericht dat de bot moet bewerken
// ------------------------------------

client.once('ready', () => {
    console.log(Bot is succesvol opgestart als ${client.user.tag}!);
});

// Deze functie luistert naar acties in het Discord Audit Log (zoals handmatige rechtermuisknop mutes)
client.on('guildAuditLogEntryCreate', async (auditLogEntry, guild) => {
    // Actie 24 staat binnen Discord voor 'Member Update' (hier vallen Timeouts onder)
    if (auditLogEntry.action === 24) { 
        const { targetId, changes } = auditLogEntry;

        // We controleren of de verandering te maken heeft met een communicatie-beperking (timeout)
        const timeoutChange = changes.find(c => c.key === 'communication_disabled_until');

        // Als er een nieuwe timeout is toegepast (en niet opgeheven)
        if (timeoutChange && timeoutChange.new) { 
            // Tel er 1 bij op voor deze specifieke gebruiker
            muteCounts[targetId] = (muteCounts[targetId] || 0) + 1;

            try {
                // Zoek het juiste kanaal en het bestaande bericht op in je server
                const channel = await client.channels.fetch(TARGET_CHANNEL_ID);
                const message = await channel.messages.fetch(LOG_MESSAGE_ID);

                // We bouwen de nieuwe tekst op voor het bericht
                let updatedText = 📊 **Live Mute & Timeout Counter:**\n\n;
                for (const [userId, count] of Object.entries(muteCounts)) {
                    updatedText += • <@${userId}> has been **${count}x** muted/timed out.\n;
                }

                // De bot bewerkt nu het bestaande bericht met de nieuwe aantallen
                await message.edit(updatedText);
                console.log(Bericht succesvol bijgewerkt voor gebruiker ID: ${targetId});
            } catch (error) {
                console.error("Het aanpassen van het Discord-bericht is mislukt:", error);
            }
        }
    }
});

// De bot logt in met het geheime token dat we straks in Render invullen
client.login(process.env.DISCORD_TOKEN);
