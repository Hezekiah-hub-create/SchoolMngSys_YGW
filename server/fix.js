require('dotenv').config({path: '.env'});
const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_KEY;

if (!url || !key) {
    console.error('No supabase url/key');
    process.exit(1);
}

const supabase = createClient(url, key);

async function fix() {
    const { data, error } = await supabase.from('settings').select('*');
    if (error) {
        console.error(error);
        return;
    }
    
    for (let setting of data) {
        let current_term = setting.current_term;
        let new_term = current_term;
        let changed = false;

        if (typeof current_term === 'string' && current_term.includes('target')) {
            try {
                let parsed = JSON.parse(current_term);
                if (parsed.target && parsed.target.value) {
                    new_term = parsed.target.value;
                    changed = true;
                }
            } catch(e) {}
        } else if (typeof current_term === 'object' && current_term.target && current_term.target.value) {
            new_term = current_term.target.value;
            changed = true;
        }

        if (changed) {
            console.log('Fixing settings for id ' + setting.id + ' to ' + new_term);
            const { error: updError } = await supabase.from('settings').update({ current_term: new_term }).eq('id', setting.id);
            if (updError) {
                console.error('Failed to update:', updError);
            } else {
                console.log('Successfully updated settings id ' + setting.id);
            }
        }
    }
}
fix();
