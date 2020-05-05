const Discord = require('discord.js')
const client = new Discord.Client()
const logger = require('logger.js').LoggerFactory.getLogger('main', 'purple')
const env = require('dotenv-safe').config().parsed

client.setMaxListeners(0)

let watching = []

const listen = async channel_id => {
  let channel
  if (client.channels.cache.has(channel_id)) {
    channel = client.channels.cache.get(channel_id)
  } else {
    channel = await client.channels.fetch(channel_id)
  }
  watching.push(channel.id)
}

const unlisten = async channel_id => {
  let channel
  if (client.channels.cache.has(channel_id)) {
    channel = client.channels.cache.get(channel_id)
  } else {
    channel = await client.channels.fetch(channel_id)
  }
  if (watching.includes(channel.id)) {
    delete watching[watching.indexOf(channel.id)]
    watching = watching.filter(e => e !== undefined && e !== null)
  }
}

const channel = async channel_id => {
  if (client.channels.cache.has(channel_id)) {
    return client.channels.cache.get(channel_id)
  } else {
    return await client.channels.fetch(channel_id)
  }
}

const guild = async guild_id => {
  if (client.guilds.cache.has(guild_id)) {
    return client.guilds.cache.get(guild_id)
  } else return null
}

const discord = { //eslint-disable-line no-unused-vars
  listen,
  unlisten,
  on: listen,
  off: unlisten,
  channel,
  guild,
}

client.on('ready', () => {
  logger.info(`Logged in with ${client.user.tag} (${client.user.id}).`)
})

const repl = require('repl')

const { inspect } = require('util')

const e = async cmd => {
  cmd = cmd.replace(/(.*)\n/, '$1')
  logger.info(`REPL < ${cmd}`)
  !(async () => {
    if (cmd.includes('await')) {
      return await eval(`(async () => {${cmd}})()`)
    } else return await eval(cmd)
  })().then(data => {
    logger.info(`REPL > ${inspect(data)}`)
  }).catch(e => {
    logger.info(`REPL > ${e.stack || e}`)
  })
}

const c = repl.start({ prompt: '> ', eval: e })
c.context.client = client

c.once('exit', async () => {
  client.destroy()
  process.exit()
})

let lastMessage // eslint-disable-line no-unused-vars
let msg = []

client.on('message', async message => {
  if (watching.includes(message.channel.id)) {
    c.context.msg = message
    msg.push(message)
    msg = msg.reverse()
    lastMessage = message
    logger.info(`${message.author.tag} (${message.author.id}) : ${message.channel.name} (${message.channel.id}) : ${message.id} : ${message.content}`)
    message.attachments.forEach(a => {
      logger.debug(` - Attachment: ${a.url}`)
    })
  }
})

logger.info('Logging in...')
client.login(env.TOKEN)
