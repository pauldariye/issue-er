const { google } = require('googleapis')

const config = require('../config')

const { secret, scopes, workDir, rootId } = config.google

const jwtClient = new google.auth.JWT({
  email: secret.client_email,
  key: secret.private_key,
  scopes
})

const drive = google.drive({
  version: 'v3',
  auth: jwtClient
})

const MIME_TYPE = "application/vnd.google-apps.folder"


let counter = 0

async function workspace () {
  try {

    return await createFolder(workDir)

  } catch (err) {
    console.log(err)
  }
}

async function findFolder (name) {

  if (!name) return

  const params = {
    supportsTeamDrives: true,
    includeTeamDriveItems: true,
    pageSize: 1,
    fields: `files(id, name, parents), incompleteSearch`
  }

  params.q = `mimeType='${MIME_TYPE}' and name contains '${name}'`

  try {

    const { data: { files } } = await drive.files.list(params)

    const file = files.find(file => file.name === name)

    if (file && Object.keys(file).length > 0) {
      return await getFolder(file)
    }

    return null
  } catch(err) {
    console.log(err)
  }
}

async function getFolder (file) {

  if (!file.id) throw new Error(`missing_id`)

  const params = {
    fileId: file.id,
    supportsTeamDrives: true,
    fields: `id, name, parents`
  }

  try {

    const { data } = await drive.files.get(params)

    return data
  } catch(err) {
    console.log(err)
  }
}

async function createFolder (name, parents=[]) {

  if (!name) return

  try {

    const folder = await findFolder(name)

    if (folder) return folder

    const resource = {
      name,
      parents,
      mimeType: MIME_TYPE,
    }

    const params = {
      supportsTeamDrives: true,
      fields: `id, name`
    }

    const { data: { id, name: folderName } } =  await drive.files.create({
      resource,
      ...params
    })

    return { id, name: folderName }

  } catch (err) {
    console.log(err)
  }
}

module.exports = {
  createFolder,
  findFolder,
  getFolder,
  workspace
}

