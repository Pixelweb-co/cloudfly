#!/usr/bin/env python3
"""
ARI Bot API Server - REST API for initiating and managing outbound calls
"""
import os
import threading
import time
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests

# Configuration
ARI_URL = os.getenv('ARI_URL', 'http://asterisk:8088')
ARI_USER = os.getenv('ARI_USER', 'ariuser')
ARI_PASS = os.getenv('ARI_PASS', 'aripass')
APP_NAME = 'voicebot'

app = Flask(__name__)
CORS(app)

# Store active calls
active_calls = {}
call_lock = threading.Lock()

class OutboundCall:
    """Represents an outbound call session"""
    def __init__(self, call_id, number, customer_name, agent_context, tenant_id, subject):
        self.call_id = call_id
        self.number = number
        self.customer_name = customer_name
        self.agent_context = agent_context
        self.tenant_id = tenant_id
        self.subject = subject
        self.channel_id = None
        self.status = 'initiating'
        self.created_at = time.time()

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'ari-bot-api',
        'active_calls': len(active_calls)
    }), 200

@app.route('/call', methods=['POST'])
def initiate_call():
    """
    Initiate an outbound call
    
    Request Body:
    {
        "number": "1003",              # Extension or phone number to call
        "customer_name": "Edwin",       # Customer name for personalization
        "agent_context": "Cobro de factura 2025 por valor de $25,000",
        "tenant_id": "tenant_001",      # Optional tenant identifier
        "subject": "Recordatorio de pago" # Call subject/purpose
    }
    """
    try:
        # Try to get data from JSON, or Form, or Args
        # Try to get data from JSON, or Form, or Args
        data = None
        
        # 1. Try strict JSON first
        try:
             data = request.get_json(force=True, silent=True)
        except:
             data = None

        # 2. If valid JSON failed (e.g. n8n sending form-data with json header), try Form Data
        if not data:
             data = request.form.to_dict()
             
        # 3. If still empty, check query args
        if not data:
             data = request.args.to_dict()
            
        if not data:
             # Last resort, maybe raw data
             try:
                 import json
                 data = json.loads(request.data)
             except:
                 pass
                 
        if not data:
             return jsonify({'error': 'No data provided', 'content_type': request.content_type}), 400
        
        # Validate required fields
        required_fields = ['number', 'customer_name', 'agent_context']
        missing = [f for f in required_fields if f not in data]
        if missing:
            return jsonify({
                'error': 'Missing required fields',
                'missing': missing
            }), 400
        
        # Extract parameters
        number = data['number']
        customer_name = data['customer_name']
        agent_context = data['agent_context']
        tenant_id = data.get('tenant_id', 'default')
        subject = data.get('subject', 'Llamada automática')
        
        # Generate unique call ID
        call_id = f"outbound_{tenant_id}_{int(time.time())}"
        
        # Create call object
        call = OutboundCall(
            call_id=call_id,
            number=number,
            customer_name=customer_name,
            agent_context=agent_context,
            tenant_id=tenant_id,
            subject=subject
        )
        
        # Store in active calls
        with call_lock:
            active_calls[call_id] = call
        
        # Initiate the call via Asterisk ARI
        auth = (ARI_USER, ARI_PASS)
        
        # Originate call
        # endpoint: PJSIP/{number}
        # app: voicebot
        # appArgs: Contains context data
        originate_url = f"{ARI_URL}/ari/channels"
        
        # Build app args (will be passed to the bot)
        app_args = f"call_id={call_id},customer={customer_name},context={agent_context},tenant={tenant_id},subject={subject}"
        
        payload = {
            'endpoint': f'PJSIP/{number}',
            'app': APP_NAME,
            'appArgs': app_args,
            'callerId': 'VoiceBot <2000>',
            'timeout': 30  # Ring timeout in seconds
        }
        
        print(f"📞 Initiating outbound call to {number} (Call ID: {call_id})")
        print(f"📤 Payload to Asterisk: {payload}")
        
        try:
            response = requests.post(originate_url, auth=auth, json=payload, timeout=10)
            
            if response.status_code in [200, 201]:
                channel_data = response.json()
                call.channel_id = channel_data.get('id')
                call.status = 'ringing'
                
                return jsonify({
                    'success': True,
                    'call_id': call_id,
                    'channel_id': call.channel_id,
                    'status': call.status,
                    'number': number,
                    'message': f'Call initiated to {number} for {customer_name}'
                }), 201
            else:
                print(f"❌ Asterisk Error: {response.status_code} - {response.text}")
                call.status = 'failed'
                return jsonify({
                    'success': False,
                    'call_id': call_id,
                    'error': f'ARI error: {response.status_code}',
                    'details': response.text
                }), 500
        except requests.exceptions.RequestException as req_err:
             print(f"❌ Connection to Asterisk Failed: {req_err}")
             return jsonify({
                'success': False,
                'error': 'Failed to connect to Asterisk',
                'details': str(req_err)
            }), 500
            
            
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"❌ API Error: {e}")
        print(f"📋 Traceback: {error_details}")
        return jsonify({
            'success': False,
            'error': str(e),
            'details': error_details if app.debug else 'Internal server error'
        }), 500

@app.route('/call/<call_id>', methods=['GET'])
def get_call_status(call_id):
    """Get status of a specific call"""
    with call_lock:
        call = active_calls.get(call_id)
        
    if not call:
        return jsonify({
            'error': 'Call not found',
            'call_id': call_id
        }), 404
    
    return jsonify({
        'call_id': call.call_id,
        'number': call.number,
        'customer_name': call.customer_name,
        'status': call.status,
        'channel_id': call.channel_id,
        'duration': int(time.time() - call.created_at),
        'tenant_id': call.tenant_id,
        'subject': call.subject
    }), 200

@app.route('/call/<call_id>/hangup', methods=['POST'])
def hangup_call(call_id):
    """Hangup an active call"""
    with call_lock:
        call = active_calls.get(call_id)
    
    if not call:
        return jsonify({
            'error': 'Call not found',
            'call_id': call_id
        }), 404
    
    if not call.channel_id:
        return jsonify({
            'error': 'Call not yet connected',
            'call_id': call_id
        }), 400
    
    try:
        auth = (ARI_USER, ARI_PASS)
        hangup_url = f"{ARI_URL}/ari/channels/{call.channel_id}"
        
        response = requests.delete(hangup_url, auth=auth, timeout=5)
        
        if response.status_code in [204, 404]:  # 404 if already hung up
            call.status = 'ended'
            
            # Remove from active calls after a delay
            def cleanup():
                time.sleep(5)
                with call_lock:
                    active_calls.pop(call_id, None)
            threading.Thread(target=cleanup, daemon=True).start()
            
            return jsonify({
                'success': True,
                'call_id': call_id,
                'message': 'Call terminated'
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': f'Failed to hangup: {response.status_code}',
                'details': response.text
            }), 500
            
    except Exception as e:
        print(f"❌ Hangup Error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/transfer/<path:channel_id>/<extension>', methods=['POST'])
def transfer_channel(channel_id, extension):
    """
    Transfer an active channel to another extension in the dialplan.
    Optionally sets channel variables if provided in the JSON body.
    """
    try:
        # Convert underscores back to dots for Asterisk
        target_channel_id = channel_id.replace('_', '.')
        auth = (ARI_USER, ARI_PASS)
        
        # 1. Set variables if provided in JSON
        data = request.get_json(silent=True)
        if data and isinstance(data, dict):
             for key, value in data.items():
                 var_url = f"{ARI_URL}/ari/channels/{target_channel_id}/variable"
                 try:
                     requests.post(var_url, auth=auth, params={'variable': key, 'value': str(value)}, timeout=2)
                     print(f"✅ Set var {key}={value} on {target_channel_id}")
                 except Exception as var_err:
                     print(f"⚠️ Failed to set var {key}: {var_err}")

        # 2. Perform the Continue (Dialplan Transfer) with delay
        def do_delayed_transfer(cid, ext, auth_info):
            print(f"⏳ Waiting 8s before transferring channel {cid} to {ext}...", flush=True)
            time.sleep(8)
            continue_url = f"{ARI_URL}/ari/channels/{cid}/continue"
            p = {'context': 'default', 'extension': ext, 'priority': 1}
            try:
                res = requests.post(continue_url, auth=auth_info, params=p, timeout=5)
                print(f"🔄 Transfer of {cid} to {ext} result: {res.status_code}", flush=True)
            except Exception as e:
                print(f"❌ Delayed Transfer Error for {cid}: {e}", flush=True)

        threading.Thread(target=do_delayed_transfer, args=(target_channel_id, extension, auth), daemon=True).start()
        
        return jsonify({
            'success': True,
            'channel_id': target_channel_id,
            'extension': extension,
            'message': f'Transfer to {extension} scheduled in 8 seconds'
        }), 200


            
    except Exception as e:
        print(f"❌ Transfer Error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/hangup/<path:channel_id>', methods=['POST'])
def hangup_channel_direct(channel_id):
    """Directly hangup a channel by its ID with a small delay to allow final TTS to play"""
    try:
        # Convert underscores back to dots for Asterisk
        target_channel_id = channel_id.replace('_', '.')
        
        def do_delayed_hangup(cid):
            print(f"⏳ Waiting 8s before hanging up channel: {cid}...", flush=True)
            time.sleep(8) # Give time for the last response to be spoken
            try:
                auth = (ARI_USER, ARI_PASS)
                hangup_url = f"{ARI_URL}/ari/channels/{cid}"
                res = requests.delete(hangup_url, auth=auth, timeout=5)
                print(f"🛑 Delayed hangup for {cid} result: {res.status_code}", flush=True)
            except Exception as e:
                print(f"❌ Delayed Hangup Error for {cid}: {e}", flush=True)

        # Start hangup in background thread
        threading.Thread(target=do_delayed_hangup, args=(target_channel_id,), daemon=True).start()
        
        return jsonify({
            'success': True,
            'channel_id': target_channel_id,
            'message': 'Hangup scheduled in 8 seconds'
        }), 200


    except Exception as e:
        print(f"❌ Hangup Scheduling Error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/calls', methods=['GET'])
def list_calls():
    """List all active calls"""
    with call_lock:
        calls_list = [
            {
                'call_id': call.call_id,
                'number': call.number,
                'customer_name': call.customer_name,
                'status': call.status,
                'duration': int(time.time() - call.created_at),
                'tenant_id': call.tenant_id
            }
            for call in active_calls.values()
        ]
    
    return jsonify({
        'total': len(calls_list),
        'calls': calls_list
    }), 200

if __name__ == '__main__':
    # Run Flask server
    port = int(os.getenv('API_PORT', 5000))
    print(f"🚀 Starting ARI Bot API Server on port {port}")
    app.run(host='0.0.0.0', port=port, debug=False)
