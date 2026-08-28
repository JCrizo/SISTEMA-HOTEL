import { createClient } from '@supabase/supabase-js'

// Need to read from .env for credentials
import * as dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function test() {
  const { data, error } = await supabase
    .from('hospedajes')
    .select('habitacion_id, ingreso, salida_estimada, nro_ficha, tarifa_pactada, estado_pago, metodo_pago, clientes(nombres)')
    .limit(1)

  if (error) {
    console.error('ERROR:', error)
  } else {
    console.log('SUCCESS:', data)
  }
}

test()
