"use client";

import AmbientField from "@/app/components/AmbientField";
import CanvasLifeform from "@/app/components/CanvasLifeform";
import CharacterUploadPanel from "@/app/components/CharacterUploadPanel";
import ChatInput from "@/app/components/ChatInput";
import ChatMessages from "@/app/components/ChatMessages";
import CompanionPanel from "@/app/components/CompanionPanel";
import MemoryDrawer from "@/app/components/MemoryDrawer";
import MusicDrawer from "@/app/components/MusicDrawer";
import ParticleLifeform from "@/app/components/ParticleLifeform";
import WhisperBubble from "@/app/components/WhisperBubble";
import { useCompanionState } from "@/app/hooks/useCompanionState";

/* ---- Canvas engine toggle (Phase 7.0) ---- */
const USE_CANVAS = true;

export default function Home() {
  const {
    activeAction,
    message,
    setMessage,
    whisper,
    character,
    showUploadPanel,
    messages,
    isTyping,
    currentEmotion,
    memoryCards,
    memoryDrawerOpen,
    musicDrawerOpen,
    currentChannel,
    isPlaying,
    timeOfDay,
    lifeformState,
    handleAction,
    handleSubmit,
    deleteMemory,
    closeMemoryDrawer,
    closeMusicDrawer,
    selectChannel,
    togglePlayPause,
    cancelUpload,
    confirmCharacter,
    restoreDefault
  } = useCompanionState();

  return (
    <main className="atmosphere-shell flex min-h-svh items-stretch justify-center px-4 py-4 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-28 bg-gradient-to-b from-black/35 to-transparent" />
      <div className="relative z-20 flex min-h-[calc(100svh-2rem)] w-full max-w-7xl flex-col">
        <header className="flex items-center gap-3 px-1 py-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#8ff8dd] shadow-[0_0_18px_rgba(143,248,221,0.9)]" />
          <span className="text-[13px] font-medium tracking-[0.12em] text-white/64">
            PUPU
          </span>
          <span className="text-[10px] tracking-[0.18em] text-white/20">
            悲伤止疼剂
          </span>
        </header>

        <section className="relative grid flex-1 grid-rows-[1fr_auto] gap-4 lg:grid-cols-[1fr_270px] lg:grid-rows-1 lg:items-stretch">
          <div className="relative flex min-h-[640px] flex-col items-center justify-center overflow-hidden rounded-[28px] border border-white/[0.06] bg-black/[0.08] px-4 py-8 shadow-glass sm:min-h-[720px]">
            <AmbientField />
            {USE_CANVAS ? (
              <CanvasLifeform
                characterImage={character?.imageUrl}
                emotion={currentEmotion}
                timeOfDay={timeOfDay}
                musicChannel={isPlaying ? currentChannel?.id ?? null : null}
                isMusicPlaying={isPlaying}
                lifeformState={lifeformState}
              />
            ) : (
              <ParticleLifeform
                characterImage={character?.imageUrl}
                emotion={currentEmotion}
                timeOfDay={timeOfDay}
                musicChannel={isPlaying ? currentChannel?.id ?? null : null}
                isMusicPlaying={isPlaying}
              />
            )}
            <WhisperBubble whisper={whisper} />
            <ChatMessages messages={messages} isTyping={isTyping} />
            <ChatInput
              message={message}
              onMessageChange={setMessage}
              onSubmit={handleSubmit}
            />

            {/* character upload panel */}
            <CharacterUploadPanel
              open={showUploadPanel}
              hasCharacter={character !== null}
              onConfirm={confirmCharacter}
              onCancel={cancelUpload}
              onRestoreDefault={restoreDefault}
            />

            {/* memory drawer */}
            <MemoryDrawer
              open={memoryDrawerOpen}
              cards={memoryCards}
              onClose={closeMemoryDrawer}
              onDelete={deleteMemory}
            />

            {/* music drawer */}
            <MusicDrawer
              open={musicDrawerOpen}
              currentChannel={currentChannel}
              isPlaying={isPlaying}
              onClose={closeMusicDrawer}
              onSelect={selectChannel}
              onTogglePlay={togglePlayPause}
            />
          </div>

          <CompanionPanel
            activeAction={activeAction}
            onAction={handleAction}
            character={character}
            memoryCount={memoryCards.length}
            currentChannel={currentChannel}
            isPlaying={isPlaying}
          />
        </section>
      </div>
    </main>
  );
}
