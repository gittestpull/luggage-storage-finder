import { NextRequest, NextResponse } from 'next/server';

// AI 이미지 분석 API 엔드포인트
// Google Gemini Vision API를 사용하여 이미지에서 정보 추출

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { image, mode = 'storage' } = body;

        if (!image) {
            return NextResponse.json(
                { message: '이미지가 필요합니다.' },
                { status: 400 }
            );
        }

        // base64 이미지 데이터에서 prefix 제거
        const base64Data = image.replace(/^data:image\/\w+;base64,/, '');

        // Gemini API 키 확인
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            console.error('GEMINI_API_KEY is not set');
            // API 키가 없을 경우 더미 응답 반환 (개발/테스트용)
            if (mode === 'storage') {
                return NextResponse.json({
                    name: '',
                    address: '',
                    openTime: '',
                    closeTime: '',
                    smallPrice: null,
                    largePrice: null,
                    phoneNumber: '',
                    confidence: 0,
                    message: 'AI API 키가 설정되지 않았습니다. .env 파일에 GEMINI_API_KEY를 추가해주세요.'
                });
            } else {
                return NextResponse.json({
                    name: '',
                    address: '',
                    category: '',
                    menu: '',
                    description: '',
                    confidence: 0,
                    message: 'AI API 키가 설정되지 않았습니다. .env 파일에 GEMINI_API_KEY를 추가해주세요.'
                });
            }
        }

        // 모드에 따른 프롬프트 설정
        const storagePrompt = `이 이미지에서 짐보관소/물품보관소/코인락커 관련 정보를 추출해주세요.

다음 정보를 찾아서 JSON 형태로 응답해주세요:
- name: 상호명/이름 (없으면 빈 문자열)
- address: 주소 (없으면 빈 문자열)
- openTime: 개장 시간 (HH:MM 형식, 없으면 빈 문자열)
- closeTime: 폐장 시간 (HH:MM 형식, 없으면 빈 문자열)
- smallPrice: 소형 보관함 가격 (숫자만, 없으면 null)
- largePrice: 대형 보관함 가격 (숫자만, 없으면 null)
- phoneNumber: 전화번호 (없으면 빈 문자열)
- confidence: 추출 정확도 (0.0 ~ 1.0)

JSON만 응답하고, 추가 설명은 하지 마세요.
이미지에서 정보를 찾을 수 없으면 빈 값으로 응답하세요.`;

        const placePrompt = `이 이미지에서 맛집/카페/음식점 관련 정보를 추출해주세요.

다음 정보를 찾아서 JSON 형태로 응답해주세요:
- name: 가게 이름/상호명 (없으면 빈 문자열)
- address: 주소 (없으면 빈 문자열)
- category: 카테고리 (예: 카페, 한식, 양식, 분식 등, 없으면 빈 문자열)
- menu: 대표 메뉴나 추천 메뉴 (없으면 빈 문자열)
- description: 가게 특징이나 분위기 설명 (없으면 빈 문자열)
- confidence: 추출 정확도 (0.0 ~ 1.0)

JSON만 응답하고, 추가 설명은 하지 마세요.
이미지에서 정보를 찾을 수 없으면 빈 값으로 응답하세요.`;

        const prompt = mode === 'storage' ? storagePrompt : placePrompt;

        // Gemini API 호출
        const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-002:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                { text: prompt },
                                {
                                    inline_data: {
                                        mime_type: 'image/jpeg',
                                        data: base64Data
                                    }
                                }
                            ]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.2,
                        maxOutputTokens: 1024,
                    }
                })
            }
        );

        if (!geminiResponse.ok) {
            const errorData = await geminiResponse.json();
            console.error('Gemini API error:', errorData);

            // 요청 제한 초과
            if (errorData.error?.status === 'RESOURCE_EXHAUSTED') {
                return NextResponse.json(
                    { message: 'AI 분석 요청이 많아 잠시 후 다시 시도해주세요. (약 1분 후)' },
                    { status: 429 }
                );
            }

            return NextResponse.json(
                { message: 'AI 분석 중 오류가 발생했습니다.' },
                { status: 500 }
            );
        }

        const geminiData = await geminiResponse.json();

        // Gemini 응답에서 텍스트 추출
        const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!responseText) {
            return NextResponse.json(
                { message: '이미지에서 정보를 추출할 수 없습니다.' },
                { status: 400 }
            );
        }

        // JSON 파싱 시도
        try {
            // 응답에서 JSON 부분만 추출 (코드 블록 제거)
            let jsonStr = responseText;

            // ```json ... ``` 형식 처리
            const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
            if (jsonMatch) {
                jsonStr = jsonMatch[1];
            }

            const parsedResult = JSON.parse(jsonStr.trim());

            // 결과 정규화 (모드에 따라)
            if (mode === 'storage') {
                const result = {
                    name: parsedResult.name || '',
                    address: parsedResult.address || '',
                    openTime: parsedResult.openTime || '',
                    closeTime: parsedResult.closeTime || '',
                    smallPrice: parsedResult.smallPrice ? Number(parsedResult.smallPrice) : null,
                    largePrice: parsedResult.largePrice ? Number(parsedResult.largePrice) : null,
                    phoneNumber: parsedResult.phoneNumber || '',
                    confidence: parsedResult.confidence ? Number(parsedResult.confidence) : 0.5
                };
                return NextResponse.json(result);
            } else {
                const result = {
                    name: parsedResult.name || '',
                    address: parsedResult.address || '',
                    category: parsedResult.category || '',
                    menu: parsedResult.menu || '',
                    description: parsedResult.description || '',
                    confidence: parsedResult.confidence ? Number(parsedResult.confidence) : 0.5
                };
                return NextResponse.json(result);
            }

        } catch (parseError) {
            console.error('JSON parse error:', parseError, 'Response:', responseText);
            return NextResponse.json(
                {
                    message: '분석 결과를 처리할 수 없습니다.',
                    rawResponse: responseText
                },
                { status: 500 }
            );
        }

    } catch (error) {
        console.error('AI 분석 API 오류:', error);
        return NextResponse.json(
            { message: '서버 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
