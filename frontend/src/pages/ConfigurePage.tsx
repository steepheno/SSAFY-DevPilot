import { useState } from 'react';
import axios from 'axios';

const ConfigurePage = () => {
  const API_URL = import.meta.env.VITE_API_URL;

  // 입력 필드 상태 관리
  const [gitToken, setGitToken] = useState('');
  const [gitCredentialsId, setGitCredentialsId] = useState('');
  const [gitRepoUrl, setGitRepoUrl] = useState('');
  const [jenkinsJobName, setJenkinsJobName] = useState('');

  // 폼 제출 상태 관리
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setError] = useState(null);
  const [, setSuccess] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      // 입력값 검증
      if (!gitToken || !gitCredentialsId || !gitRepoUrl || !jenkinsJobName) {
        alert('모든 필드를 입력해주세요.');
        return;
      }

      // API 요청 데이터
      const formData = {
        gitToken,
        gitCredentialsId,
        gitRepoUrl,
        jenkinsJobName,
      };
      console.log('API 요청 데이터: ', formData);

      // API 요청
      const response = await axios.post(`${API_URL}/git/register/gitlab`, formData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('API 응답: ', response.data);

      // 성공 상태
      setSuccess(true);
      console.log('formData: ', formData);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="px-5 py-10">
      <div className="mb-10">
        <p>Gitlab Token</p>
        <input
          type="text"
          className="bg-gray-200"
          value={gitToken}
          onChange={(e) => setGitToken(e.target.value)}
        />
      </div>

      <div className="mb-10">
        <p>Git Credential ID</p>
        <input
          type="text"
          className="bg-gray-200"
          value={gitCredentialsId}
          onChange={(e) => setGitCredentialsId(e.target.value)}
        />
      </div>

      <div className="mb-10">
        <p>Git Repository URL</p>
        <input
          type="text"
          className="bg-gray-200"
          value={gitRepoUrl}
          onChange={(e) => setGitRepoUrl(e.target.value)}
        />
      </div>

      <div className="mb-10">
        <p>Jenkins Job Name</p>
        <input
          type="text"
          className="bg-gray-200"
          value={jenkinsJobName}
          onChange={(e) => setJenkinsJobName(e.target.value)}
        />
      </div>

      <div>
        <button
          className="rounded-[10px] bg-blue-500 px-4 py-2 text-white"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? '처리 중...' : '빌드하기'}
        </button>
      </div>
    </div>
  );
};

export default ConfigurePage;
