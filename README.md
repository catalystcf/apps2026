# apps2026
Misc apps for 2026 or what's is remaining

# Google Family Settings Monitor

## Project summary

An app that drives a real (headless) browser to log into Google services and monitor settings across the Google family. Monitoring only for now; no changes are made to any settings.

- **Approach:** Playwright running in Docker, with a persisted browser session (profile or `storageState`) so login is done once by hand, not automated on every run.
- **Host:** an old Windows 10 PC, rebuilt as a headless Linux server. A residential IP is less likely to trigger Google's "verify it's you" challenges than a datacenter VPS.
- **Schedule:** modest (every few hours), same IP and browser fingerprint each time.
- **Alerting:** a "session invalid" detector that notifies me when I need to log in again.
- **Later:** the box may host an app server reachable from outside. Step 1 only makes sure the choices made now don't block that.

---

## Step 1: Bring the host to life

**Goal:** a stable, headless Linux box with Docker running and a reliable network connection, chosen and set up so that outside access can be added later without a rebuild.

**Out of scope for this step:** router config, port forwarding, DNS, tunnels, TLS, the app itself, the Google login.

### 1.1 Pre-flight (before wiping Windows
- [ ] Check disk health (SMART); if it's a spinning HDD, plan to swap in a cheap SSD
- [ ] Confirm RAM (target 8 GB, 4 GB minimum) and that the CPU is 64-bit
- [ ] Note the BIOS/UEFI key and check that the machine can boot from USB

### 1.2 Selection decisions (to keep outside access easy later)

| Decision | Recommendation | Why it matters for later |
|---|---|---|
| Distro | Debian 12 or Ubuntu Server LTS, no desktop | Stable, long support, first-class Docker docs, low RAM use |
| Connection | Wired ethernet, not Wi-Fi | Reliability and predictable addressing; far better for anything reachable from outside |
| Local address | Plan a fixed LAN address (DHCP reservation on the router or a static IP) | Any future forwarding or tunnel needs a target that never moves |
| Hostname | Pick a clear, permanent hostname now (e.g. `homebox`) | Easier to reference in configs and certificates later |
| Access | SSH with key-based login; disable password login | The box will be exposed one day, so start with a hardened baseline |
| Docker install | Docker Engine from Docker's official apt repo, with the Compose plugin | Current version, and how the Playwright image is run |
| Storage layout | Put Docker data and app volumes on the SSD; keep a dedicated directory for the browser profile | Easy to back up and move |
| Power | BIOS set to power on after AC loss; optional small UPS | Avoids silent downtime after outages |
| Future ISP check | Find out whether the home connection has a public IP or sits behind CGNAT | Decides later whether port forwarding is possible or a tunnel is needed. Check only, no config |

### 1.3 Install and bring up
1. Create a bootable USB with the chosen distro
2. Install with minimal packages (standard system utilities plus SSH server only), and set the hostname
3. Connect ethernet and confirm internet access
4. Reserve or set the LAN address (per the table above)
5. Create a non-root admin user, add an SSH key, and confirm key login from my main computer
6. Update the system and enable automatic security updates (`unattended-upgrades`)
7. Install Docker Engine and the Compose plugin; add my user to the `docker` group
8. Set the timezone and NTP (time sync)
9. Optionally enable a basic firewall (deny incoming except SSH from the LAN)

### 1.4 Done when
- [ ] The box boots headless and comes back on its own after a power cycle
- [ ] I can SSH in by key from my main computer using the hostname or fixed address
- [ ] `docker run hello-world` succeeds
- [ ] `docker run --rm mcr.microsoft.com/playwright:<pinned-tag>` can pull and start (a full test is step 2)
- [ ] The system stays up and reachable overnight without intervention
- [ ] I know whether the ISP gives a public IP or CGNAT (noted for the later step)

### 1.5 Time estimate

| Task | Estimate |
|---|---|
| Pre-flight: backup, SMART check, hardware check | 30-60 min |
| OS install and base setup | 45-60 min |
| Network, SSH keys, hardening basics | 30-45 min |
| Docker install and verification | 15-30 min |
| Overnight stability check | passive (1 night) |
| **Total hands-on** | **about 2-3.5 hours** |

Add 1-2 hours if the disk needs replacing or the BIOS or USB boot causes trouble on old hardware. Realistically this is one evening plus an overnight soak test.

---

## Next steps (not started)
- Step 2: run Playwright in Docker, do the initial Google login, and persist the session
- Step 3: build the monitoring job, scheduler, and session-invalid alerting
- Step 4: decide how (or whether) to make the box reachable from outside
- 
