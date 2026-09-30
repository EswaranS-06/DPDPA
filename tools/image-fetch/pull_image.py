"""Download a public image (linux/amd64) from a registry into a `docker load` tar, without Docker."""
import hashlib, io, json, sys, tarfile, urllib.request

REGISTRY, REPO, TAG, OUT = sys.argv[1:5]  # e.g. quay.io keycloak/keycloak 26.0 keycloak.tar
ACCEPT = ", ".join([
    "application/vnd.oci.image.index.v1+json",
    "application/vnd.docker.distribution.manifest.list.v2+json",
    "application/vnd.oci.image.manifest.v1+json",
    "application/vnd.docker.distribution.manifest.v2+json",
])


def get_token():
    if REGISTRY == "quay.io":
        url = f"https://quay.io/v2/auth?service=quay.io&scope=repository:{REPO}:pull"
    else:
        url = f"https://auth.docker.io/token?service=registry.docker.io&scope=repository:{REPO}:pull"
    return json.load(urllib.request.urlopen(url))["token"]


TOKEN = get_token()
HOST = "registry-1.docker.io" if REGISTRY == "docker.io" else REGISTRY


def fetch(path, accept=ACCEPT):
    req = urllib.request.Request(f"https://{HOST}/v2/{REPO}/{path}",
                                 headers={"Authorization": f"Bearer {TOKEN}", "Accept": accept})
    return urllib.request.urlopen(req)


manifest = json.load(fetch(f"manifests/{TAG}"))
if "manifests" in manifest:
    entry = next(m for m in manifest["manifests"]
                 if m.get("platform", {}).get("architecture") == "amd64"
                 and m.get("platform", {}).get("os") == "linux")
    manifest = json.load(fetch(f"manifests/{entry['digest']}"))

config_digest = manifest["config"]["digest"]
config = fetch(f"blobs/{config_digest}", "*/*").read()
assert hashlib.sha256(config).hexdigest() == config_digest.split(":")[1]

with tarfile.open(OUT, "w") as tar:
    def add(name, data):
        info = tarfile.TarInfo(name); info.size = len(data); tar.addfile(info, io.BytesIO(data))

    cfg_name = config_digest.split(":")[1] + ".json"
    add(cfg_name, config)
    layers = []
    for i, layer in enumerate(manifest["layers"]):
        data = fetch(f"blobs/{layer['digest']}", "*/*").read()
        assert hashlib.sha256(data).hexdigest() == layer["digest"].split(":")[1], "digest mismatch"
        name = layer["digest"].split(":")[1] + "/layer.tar"
        add(name, data)
        layers.append(name)
        print(f"layer {i + 1}/{len(manifest['layers'])} {len(data) / 1e6:.1f} MB", flush=True)
    add("manifest.json", json.dumps([{"Config": cfg_name, "RepoTags": [f"{REGISTRY}/{REPO}:{TAG}"],
                                      "Layers": layers}]).encode())
print("wrote", OUT)
