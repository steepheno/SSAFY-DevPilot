import MainLogo from '@/assets/login_icon.png';
import { postInitialSettings } from '@/features/initialSettings/api/postInitialSettings';
import { InitialSettings } from '@/features/initialSettings/types';

import PemUploaderContainer from '@/features/upload';
import { useConfigStore } from '@/shared/store/configStore';
import LoadingSpinner from '@/shared/ui/lottie/LoadingSpinner';
import { useState } from 'react';

const InitialPage = () => {
  const [loading, setLoading] = useState(false);

  const [settings, setSettings] = useState<InitialSettings>({
    pemPath: '',
    ec2Host: '',
    jenkinsPort: '8080',
    jenkinsPassword: '',
    configDir: '/opt/jenkins_config',
  });
  const fields = Object.keys(settings) as (keyof InitialSettings)[];

  const fieldPlaceholders: Record<keyof InitialSettings, string> = {
    pemPath: 'PEM 파일 경로',
    ec2Host: 'EC2 호스트',
    jenkinsPort: 'Jenkins 포트',
    jenkinsPassword: '사용할 Jenkins 패스워드',
    configDir: '설정 디렉토리',
  };

  const { setIsInitialized } = useConfigStore();

  // 입력 필드 변경 처리
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 유효성 검사
  const validateForm = (): boolean => {
    const hasEmpty = fields.some((key) => settings[key].trim() === '');

    if (hasEmpty) {
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
        alert(
          `초기 설정이 완료되었습니다. \n아래 발급된 Password를 반드시 저장해주세요.\nPassword: ${settings.jenkinsPassword}`,
        );
        setIsInitialized(response);
      }
    } catch (error) {
      console.error('설정 파일 다운로드 실패: ', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center">
        <LoadingSpinner />
        <span className="ml-2 text-lg font-medium">초기 설정을 처리 중입니다. </span>
        <span className="ml-2 text-sm font-normal">(5~10분 정도 걸릴 수 있습니다...)</span>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <form
        className={
          'flex min-h-[500px] max-w-[400px] flex-col items-center rounded-2xl bg-gray-200 p-10'
        }
        onSubmit={handleSubmit}
      >
        <img src={MainLogo} alt="Main Logo" className="h-[130px] w-[150px] justify-start" />

        <div className={`m-10 flex w-[280px] flex-col gap-5`}>
          {/* <div className="flex items-center gap-2 p-0"> */}
          <input
            type="text"
            name="pemPath"
            placeholder=".pem 파일 경로"
            value={settings.pemPath}
            onChange={handleChange}
            className="h-[35px] rounded-md border-none bg-white px-4 py-1.5 text-sm font-bold text-[#748194] outline-none"
          />
          {/* <PemUploaderContainer /> */}
          {/* </div> */}

          {fields
            .filter((k) => k !== 'pemPath' && k !== 'jenkinsPort' && k !== 'configDir')
            .map((key) => {
              return (
                <input
                  type="text"
                  key={key}
                  name={key}
                  value={settings[key]}
                  onChange={handleChange}
                  placeholder={fieldPlaceholders[key]}
                  className="h-[35px] rounded-md border-none bg-white px-4 py-1.5 text-sm font-bold text-[#748194] outline-none"
                />
              );
            })}
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
