<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Sso\SsoException;
use App\Sso\SsoService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

/**
 * SSO PNJ entry points. Only registered when config('services.sso.enabled')
 * is true (see routes/web.php) — otherwise both URIs 404.
 */
class SsoController extends Controller
{
    public function __construct(private SsoService $sso) {}

    public function redirect(Request $request)
    {
        $state = Str::random(40);
        $request->session()->put('sso_state', $state);

        return redirect()->away($this->sso->provider()->redirectUrl($state));
    }

    public function callback(Request $request)
    {
        $expected = $request->session()->pull('sso_state');

        if (! $expected || ! hash_equals($expected, (string) $request->query('state', ''))) {
            abort(419, 'State SSO tidak valid.');
        }

        try {
            $user = $this->sso->findOrCreateCustomer(
                $this->sso->provider()->resolveIdentity($request)
            );
        } catch (SsoException $e) {
            return redirect()->route('login')->withErrors(['email' => $e->getMessage()]);
        }

        Auth::login($user, true);
        $request->session()->regenerate();

        // Kembali ke halaman checkout yang tersimpan sebelum login, bila ada dan internal.
        $intendedUrl = $request->session()->pull('_intended_url');
        if ($intendedUrl) {
            $host = parse_url($intendedUrl, PHP_URL_HOST);
            if (! $host || $host === $request->getHost()) {
                return redirect($intendedUrl);
            }
        }

        return redirect()->intended(route('dashboard'));
    }
}
