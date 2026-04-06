<?php

namespace App\Http\Controllers;


use App\Http\Requests\User\ChangePasswordRequest;
use App\Http\Requests\User\LoginRequest;
use App\Http\Resources\UserLoginResource;
use App\Http\Resources\UserResource;
use App\Repositories\Interfaces\IUserRepository;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use App\Http\Requests\User\ResetPasswordRequest;
use App\Http\Requests\User\SendPasswordResetLinkRequest;


class AuthController extends Controller
{
    public function __construct(protected IUserRepository $userRepository)
    {}


    /**
     * @throws ValidationException
     */
    public function login(LoginRequest $request)
    {
        $user = $this->userRepository->getByEmail($request->email);

        if (!$user || !Hash::check($request->password, $user->password))
            throw ValidationException::withMessages(['Credentials incorrect']);

        if ($request->bearerToken() && !auth('sanctum')->check())
            return response('Token invalid', 401);

        return new UserLoginResource($user, $request->bearerToken());
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()?->delete();
        return response()->json(['message' => 'Logged out']);
    }

    public function changePassword(ChangePasswordRequest $request) {
        return new UserResource($this->userRepository->setPassword($request->user()->id, Hash::make($request->password)));
    }

    public function resetPassword(Request $request) {
        $user = $this->userRepository->getByEmail($request->email);

        if(!$user)
            return response("Kein Benutzer mit dieser E-Mail vorhanden", 404);

        $this->userRepository->reset_password($user);

        return response($user, 200);
    }

    public function verifyToken(Request $request) {
        $email = $request->email;
        $token = $request->token;

        try {
            $this->userRepository->verifyToken($email, $token);
            $user = $this->userRepository->getByEmail($email);
            $user = $this->userRepository->setPasswordReset($user->id, false);
            return new UserLoginResource($user);
        } catch (\Exception $e) {
            $statusCode = is_numeric($e->getCode()) ? (int)$e->getCode() : 500;
            return response()->json(['error' => $e->getMessage()], $statusCode);
        }
    }
}
