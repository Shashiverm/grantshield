const res = await fetch('https://indexer.preprod.midnight.network/api/v4/graphql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: `
      query GetNetworkTelemetry {
        block {
          height
          hash
          protocolVersion
        }
        currentEpochInfo {
          epochNo
          durationSeconds
          elapsedSeconds
        }
      }
    `,
  }),
})

const data = await res.json()
console.log('Midnight Preprod Live Telemetry:', JSON.stringify(data, null, 2))
