import MainLogo from '@/assets/login_icon.png';
import { initialSettings } from '@/features/initialSettings/api';
import { InitialSettings } from '@/features/initialSettings/types';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const InitialPage = () => {
  const [settings, setSettings] = useState<InitialSettings>({
    pemPath: '',
    ec2Host: '',
    jenkinsPassword: '',
  });

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // 입력 필드 변경 처리
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 유효성 검사
  const validateForm = () => {
    const { pemPath, ec2Host, jenkinsPassword } = settings;
    if (!pemPath.trim() || !ec2Host.trim() || !jenkinsPassword.trim()) {
      alert('모든 필드를 입력해주세요.');
      return false;
    }
    return true;
  };

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 유효성 검사
    if (!validateForm()) {
      return;
    }

    // 로딩 상태
    setLoading(true);

    try {
      // API 호출
      const response = await initialSettings(settings);
      console.log('설정 완료: ', response);
      alert('다운로드 완료! 아래 발급된 Password를 반드시 저장해주세요.\nPassword: aaa');
      navigate('/');
    } catch (error) {
      console.error('설정 파일 다운로드 실패: ', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center">
      <form
        className="flex h-[500px] w-[400px] flex-col items-center rounded-2xl bg-gray-200"
        onSubmit={handleSubmit}
      >
        <img src={MainLogo} alt="Main Logo" className="my-10 h-[130px] w-[150px] justify-start" />
        <input
          type="text"
          name="pemPath"
          placeholder="pem Path"
          value={settings.pemPath}
          onChange={handleChange}
          className="mt-5 h-[35px] w-[280px] rounded-md border-none bg-white px-4 py-1.5 text-sm font-bold text-[#748194] outline-none"
        />
        <input
          type="text"
          name="ec2Host"
          value={settings.ec2Host}
          onChange={handleChange}
          placeholder="EC2 Host"
          className="mt-5 h-[35px] w-[280px] rounded-md border-none bg-white px-4 py-1.5 text-sm font-bold text-[#748194] outline-none"
        />
        <input
          type="text"
          name="jenkinsPassword"
          value={settings.jenkinsPassword}
          onChange={handleChange}
          placeholder="Jenkins Password"
          className="mt-5 h-[35px] w-[280px] rounded-md border-none bg-white px-4 py-1.5 text-sm font-bold text-[#748194] outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="mt-10 h-[45px] w-[280px] rounded-md border-none bg-[#0F3758] px-4 py-1.5 text-sm font-bold text-white outline-none hover:opacity-90"
        >
          {loading ? '처리 중' : '설정 파일 다운로드'}
        </button>
      </form>
    </div>
  );
};

export default InitialPage;
