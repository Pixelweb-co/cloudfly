import { UserAgent, UserAgentOptions, Inviter, SessionState, Registerer } from 'sip.js';

export interface SipConfig {
    extension: string;
    password: string;
    websocketUrl: string;
    domain: string;
}

export interface SipServiceDelegate {
    onIncomingCall?: (session: any) => void;
    onCallEnded?: () => void;
    onRegistered?: () => void;
    onUnregistered?: () => void;
}

class SipService {
    private userAgent: UserAgent | null = null;
    private registerer: Registerer | null = null;
    private currentSession: any = null;
    public delegate: SipServiceDelegate | null = null;

    async initialize(config: SipConfig) {
        // Use unique URI 'webrtc_2500' to match PJSIP endpoint name, avoiding conflict with numeric extension
        const uri = UserAgent.makeURI(`sip:webrtc_${config.extension}@${config.domain}`);
        if (!uri) throw new Error("Invalid URI");

        const transportOptions = {
            server: config.websocketUrl,
        };

        const userAgentOptions: UserAgentOptions = {
            uri,
            transportOptions,
            authorizationUsername: config.extension,
            authorizationPassword: config.password,
            contactName: `webrtc_${config.extension}`,
            contactParams: {
                transport: 'ws'
            },
            displayName: config.extension,
            delegate: {
                onInvite: (invite) => {
                    console.log("Incoming call...");
                    this.currentSession = invite;
                    this.setupSessionListeners(invite);
                    if (this.delegate?.onIncomingCall) {
                        this.delegate.onIncomingCall(invite);
                    }
                }
            }
        };

        this.userAgent = new UserAgent(userAgentOptions);

        // Handle registration state
        this.userAgent.stateChange.addListener((state) => {
            console.log(`UserAgent state change: ${state}`);
        });

        await this.userAgent.start();

        // Create registerer with proper contact header
        this.registerer = new Registerer(this.userAgent, {
            expires: 600
        });
        this.registerer.stateChange.addListener((state) => {
            console.log(`Registerer state: ${state}`);
            if (state === 'Registered') {
                this.delegate?.onRegistered?.();
            } else if (state === 'Unregistered') {
                this.delegate?.onUnregistered?.();
            }
        });

        await this.registerer.register();
    }

    async call(target: string) {
        if (!this.userAgent) return;

        const targetURI = UserAgent.makeURI(`sip:${target}@${this.userAgent.configuration.uri.host}`);
        if (!targetURI) return;

        const inviter = new Inviter(this.userAgent, targetURI);
        this.currentSession = inviter;

        this.setupSessionListeners(inviter);

        await inviter.invite();
        return inviter;
    }

    private setupSessionListeners(session: any) {
        session.stateChange.addListener((state: SessionState) => {
            console.log(`Session state changed to: ${state}`);
            if (state === SessionState.Terminated) {
                this.delegate?.onCallEnded?.();
                this.currentSession = null;
            }
        });
    }

    async hangup() {
        if (this.currentSession) {
            if (this.currentSession.state === SessionState.Initial || this.currentSession.state === SessionState.Establishing) {
                // Si está timbrando o conectando
                if (typeof this.currentSession.reject === 'function') {
                    await this.currentSession.reject();
                } else if (typeof this.currentSession.cancel === 'function') {
                    await this.currentSession.cancel();
                }
            } else {
                await this.currentSession.bye();
            }
            this.currentSession = null;
        }
    }

    async disconnect() {
        if (this.registerer) {
            await this.registerer.unregister();
        }
        if (this.userAgent) {
            await this.userAgent.stop();
        }
    }
}

export const sipService = new SipService();
