import MainLogo from '@/assets/login_icon.png';
import { postInitialSettings } from '@/features/initialSettings/api/postInitialSettings';
import { InitialSettings } from '@/features/initialSettings/types';
import PemUploaderContainer from '@/features/upload';
import { useConfigStore } from '@/shared/store/configStore';
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
  const { isInitialized, setIsInitialized } = useConfigStore();

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
      const response = await postInitialSettings(settings);
      if (response === true) {
        alert('다운로드 완료! 아래 발급된 Password를 반드시 저장해주세요.\nPassword: aaa');
        setIsInitialized(response);
      }
    } catch (error) {
      console.error('설정 파일 다운로드 실패: ', error);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = `
    [&_input]:h-[35px]
    [&_input]:rounded-md
    [&_input]:border-none
    [&_input]:bg-white
    [&_input]:px-4
    [&_input]:py-1.5
    [&_input]:text-sm
    [&_input]:font-bold
    [&_input]:text-[#748194]
    [&_input]:outline-none
`;

  return (
    <div className="flex h-screen items-center justify-center">
      <form
        className={
          'flex h-[500px] max-w-[400px] flex-col items-center rounded-2xl bg-gray-200 p-10'
        }
        onSubmit={handleSubmit}
      >
        <img src={MainLogo} alt="Main Logo" className="h-[130px] w-[150px] justify-start" />
        <div className={`${inputStyle} m-10 flex w-[280px] flex-col gap-5`}>
          {/* <div className="flex items-center gap-2 p-0"> */}
          <input
            type="text"
            name="pemPath"
            placeholder="pem Path"
            value={settings.pemPath}
            onChange={handleChange}
            className=""
          />
          {/* <PemUploaderContainer /> */}
          {/* </div> */}
          <input
            type="text"
            name="ec2Host"
            value={settings.ec2Host}
            onChange={handleChange}
            placeholder="EC2 Host"
          />
          <input
            type="text"
            name="jenkinsPassword"
            value={settings.jenkinsPassword}
            onChange={handleChange}
            placeholder="Jenkins Password"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="h-[45px] w-[280px] rounded-md border-none bg-[#0F3758] px-4 py-1.5 text-sm font-bold text-white outline-none hover:opacity-90"
        >
          {loading ? '처리 중' : '확인'}
        </button>
      </form>
    </div>
  );
};

export default InitialPage;
