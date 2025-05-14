import MainLogo from '@/assets/login_icon.png';

const LoginPage = () => {
  return (
    <div className="flex h-screen items-center justify-center">
      <form className="flex h-[450px] w-[400px] flex-col items-center rounded-2xl bg-gray-200 p-3">
        <img src={MainLogo} alt="Main Logo" className="my-10 h-[130px] w-[150px] justify-start" />
        <input
          type="password"
          placeholder="Password"
          className="mt-5 h-[35px] w-[280px] rounded-md border-none bg-white px-4 py-1.5 text-sm font-bold text-[#748194] outline-none"
        />
        <button className="mt-10 h-[45px] w-[280px] rounded-md border-none bg-[#0F3758] px-4 py-1.5 text-sm font-bold text-white outline-none hover:opacity-90">
          로그인
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
