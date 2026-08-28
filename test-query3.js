import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const envFile = fs.readFileSync('.env', 'utf8')
const env = {}
envFile.split(/\r?\n/).forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) env[match[1]] = match[2].replace(/["'\r]/g, '')
})

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)

async function test() {
  const { data, error } = await supabase
    .from('hospedajes')
    .select('habitacion_id, salida_estimada, clientes(nombres)')
    .limit(1)

  if (error) {
    console.error('ERROR ORIGINAL QUERY:', error.message)
  } else {
    console.log('EXITO ORIGINAL QUERY:', data)
  }
}

test()
