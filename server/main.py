from flask import Flask, request, jsonify, render_template
from flask_socketio import SocketIO
import logging
import traceback
import subprocess

# logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# flask setup
app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, cors_allowed_origins="*")


def fetch_stream_url(track_id):
    """
    fetch the streaming url for a spotify track using spotdl.
    """
    constructed_url = "https://open.spotify.com/track/" + track_id
    print(constructed_url)
    try:
        cmd = ["spotdl", "url", constructed_url]
        result = subprocess.run(cmd, capture_output=True, text=True)

        if result.returncode != 0:
            raise Exception(result.stderr.strip())

        if "YT-DLP download error" in result.stdout:
            raise Exception("Error fetching streaming URL - VPN")

        stream_url = result.stdout.strip().split("\n")[-1]
        print(result.stdout.strip())
        if not stream_url.startswith("http"):
            raise Exception("Invalid streaming URL received.")
        return stream_url
    except Exception as e:
        logger.error(f"Error fetching streaming URL: {e}")
        logger.error(traceback.format_exc())
        raise

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/stream', methods=['POST'])
def stream_url():
    data = request.get_json()
    track_id = data.get('id')

    if not track_id:
        return jsonify({'error': 'No track URL provided'}), 400

    try:
        # get google stream URL
        stream_url = fetch_stream_url(track_id)
        return jsonify({'message': 'Stream URL fetched', 'stream_url': stream_url}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

    
if __name__ == '__main__':
    socketio.run(app, debug=True, port=3001)