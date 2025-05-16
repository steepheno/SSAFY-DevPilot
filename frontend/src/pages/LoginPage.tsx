import MainLogo from '@/assets/login_icon.png';
import { loginJenkins } from '@/features/login/api.ts';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // 비밀번호 상태 체크
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 유효성 검사
    if (!password.trim()) {
      alert('비밀번호를 입력해주세요.');
      return;
    }
    setIsLoading(true);

    try {
      const response = await loginJenkins({ initialPassword: password });

      if (response) {
        console.log('로그인 성공: ', response); // 디버깅 후 삭제 예정
        navigate('/');
      }
    } catch (error) {
      console.error('로그인 실패: ', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="flex h-[450px] w-[400px] flex-col items-center rounded-2xl bg-gray-200 p-3"
      >
        <img src={MainLogo} alt="Main Logo" className="my-10 h-[130px] w-[150px] justify-start" />
        <input
          type="password"
          value={password}
          onChange={handlePasswordChange}
          disabled={isLoading}
          placeholder="Password"
          className="mt-5 h-[35px] w-[280px] rounded-md border-none bg-white px-4 py-1.5 text-sm font-bold text-[#748194] outline-none"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="mt-10 h-[45px] w-[280px] rounded-md border-none bg-[#0F3758] px-4 py-1.5 text-sm font-bold text-white outline-none hover:opacity-90"
        >
          {isLoading ? '로그인 중...' : '로그인'}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
