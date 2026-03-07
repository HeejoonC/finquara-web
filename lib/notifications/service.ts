/**
 * Notification Service — Finquara
 *
 * Architecture placeholder for future Kakao AlimTalk + email notifications.
 *
 * Sending channels (future):
 *   1. Kakao Bizm / AlimTalk — when user has kakao_connected = true
 *   2. Email (e.g. Resend / SendGrid) — fallback when no Kakao, or for employers
 *
 * How to wire up:
 *   - Set KAKAO_BIZM_API_KEY + KAKAO_BIZM_SENDER_KEY in env
 *   - Set RESEND_API_KEY (or equivalent) in env
 *   - Replace TODO blocks below with actual SDK calls
 *
 * This file is server-only. Never import from client components.
 */

import { createClient } from '@/lib/supabase/server'

// ─── Types ────────────────────────────────────────────────────────────────────

interface NotificationTarget {
  userId: string
  fullName: string | null
  email: string | null
  phone: string | null
  kakaoConnected: boolean
  kakaoUserId: string | null
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

async function getTarget(userId: string): Promise<NotificationTarget | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('full_name, email, phone, kakao_connected, kakao_user_id')
    .eq('id', userId)
    .single()

  if (!data) return null

  return {
    userId,
    fullName: data.full_name,
    email: data.email,
    phone: data.phone,
    kakaoConnected: data.kakao_connected ?? false,
    kakaoUserId: data.kakao_user_id,
  }
}

async function sendKakaoAlimtalk(
  _kakaoUserId: string,
  _templateCode: string,
  _variables: Record<string, string>
): Promise<void> {
  // TODO: Integrate Kakao Bizm API
  // Reference: https://bizm.kakao.com/
  //
  // const response = await fetch('https://alimtalk.api.bizm.co.kr/sendMessage', {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //     'apikey': process.env.KAKAO_BIZM_API_KEY!,
  //   },
  //   body: JSON.stringify({
  //     senderKey: process.env.KAKAO_BIZM_SENDER_KEY,
  //     templateCode: _templateCode,
  //     recipientList: [{ recipientNo: _kakaoUserId, templateParameter: _variables }],
  //   }),
  // })
  console.log('[Kakao AlimTalk] TODO: send template', _templateCode, 'to', _kakaoUserId)
}

async function sendEmail(
  _to: string,
  _subject: string,
  _body: string
): Promise<void> {
  // TODO: Integrate email provider (e.g. Resend)
  // import { Resend } from 'resend'
  // const resend = new Resend(process.env.RESEND_API_KEY)
  // await resend.emails.send({ from: 'noreply@finquara.com', to: _to, subject: _subject, html: _body })
  console.log('[Email] TODO: send to', _to, '|', _subject)
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Send weekly job digest to a single user.
 *
 * Called by a cron job / scheduled function (e.g. Supabase Edge Function).
 * Respects the user's receive_job_mailing preference before calling this.
 */
export async function sendWeeklyJobDigest(userId: string): Promise<void> {
  const supabase = await createClient()

  const target = await getTarget(userId)
  if (!target) return

  // Fetch top matching jobs for this user
  const { data: seekerProfile } = await supabase
    .from('job_seeker_profiles')
    .select('main_specializations')
    .eq('id', userId)
    .maybeSingle()

  // TODO: build a proper job list query filtered by user's specializations
  const jobsPreviewText = '이번 주 새로운 계리 채용공고가 등록되었습니다. Finquara에서 확인하세요.'

  if (target.kakaoConnected && target.kakaoUserId) {
    await sendKakaoAlimtalk(target.kakaoUserId, 'WEEKLY_JOB_DIGEST', {
      name: target.fullName ?? '회원',
      preview: jobsPreviewText,
      link: 'https://finquara.com/jobs',
    })
  } else if (target.email) {
    await sendEmail(
      target.email,
      '[Finquara] 이번 주 계리 채용공고',
      `<p>안녕하세요 ${target.fullName ?? '회원'}님,</p><p>${jobsPreviewText}</p>`
    )
  }

  void seekerProfile // suppress unused warning until query is built out
}

/**
 * Notify a user that a recruiter has viewed or recommended their profile.
 *
 * Respects the user's open_to_recommendation preference before calling this.
 */
export async function sendRecruiterRecommendation(userId: string): Promise<void> {
  const target = await getTarget(userId)
  if (!target) return

  const message = '기업 담당자가 회원님의 프로필에 관심을 보였습니다. 지금 확인해 보세요.'

  if (target.kakaoConnected && target.kakaoUserId) {
    await sendKakaoAlimtalk(target.kakaoUserId, 'RECRUITER_RECOMMENDATION', {
      name: target.fullName ?? '회원',
      message,
      link: 'https://finquara.com/profile',
    })
  } else if (target.email) {
    await sendEmail(
      target.email,
      '[Finquara] 채용 담당자가 회원님의 프로필을 확인했습니다',
      `<p>안녕하세요 ${target.fullName ?? '회원'}님,</p><p>${message}</p>`
    )
  }
}
